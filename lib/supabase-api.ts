import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";
import { createClient as createBrowserClient } from "./supabase/client";
import { createClient as createServerClient } from "./supabase/server";
import { getServiceRoleClient, uploadImage } from "./supabase/storage";

import type {
  Attribute,
  Author,
  Category,
  Comment,
  DashboardStats,
  Post,
  Tag,
} from "./types";

const postInclude = {
  author: true,
  category: true,
  post_tags: {
    include: {
      tag: true,
    },
  },
  analytics: true,
} as const;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;
type AuthorModel = Prisma.AuthorGetPayload<{}>;
type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    admin: true;
    post: {
      select: {
        id: true;
        slug: true;
        title: true;
      };
    };
    replies: {
      include: {
        admin: true;
        post: {
          select: {
            id: true;
            slug: true;
            title: true;
          };
        };
      };
      orderBy: {
        created_at: "asc";
      }[];
    };
  };
}>;

const hasPrismaConnection =
  process.env.NODE_ENV === "production"
    ? false
    : Boolean(process.env.DATABASE_URL);
const hasSupabaseCredentials = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function missingDataSourceError(action: string) {
  return new Error(
    `Unable to ${action}. Configure a Postgres connection via DATABASE_URL or provide Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).`
  );
}

function shouldFallbackToSupabase(error: unknown): boolean {
  if (!hasPrismaConnection) return true;
  if (
    error instanceof PrismaClientKnownRequestError &&
    ["P2021", "P2022", "P1001"].includes(error.code)
  )
    return true;
  if (error instanceof PrismaClientInitializationError) return true;
  if (
    error instanceof Error &&
    (/does not exist/i.test(error.message) ||
      /can't reach database server/i.test(error.message))
  )
    return true;
  return false;
}

async function withPrismaFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  if (!hasPrismaConnection) {
    if (!hasSupabaseCredentials) {
      throw missingDataSourceError("run this query");
    }
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    if (shouldFallbackToSupabase(error) && hasSupabaseCredentials) {
      // Only log connection errors in development, and make them less verbose
      if (process.env.NODE_ENV === "development") {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorCode =
          error instanceof PrismaClientKnownRequestError
            ? error.code
            : undefined;

        // Suppress verbose connection error logs - fallback is working as expected
        if (
          errorCode === "P1001" ||
          /can't reach database server/i.test(errorMessage)
        ) {
          console.debug(
            `[supabase-api] Prisma connection unavailable (${
              errorCode || "connection error"
            }), using Supabase fallback`
          );
        } else {
          console.warn(
            "[supabase-api] Falling back to Supabase client due to Prisma error:",
            error
          );
        }
      }
      return fallback();
    }
    throw error;
  }
}

function isSupabaseTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  if (err.code === "PGRST205") return true;
  if (
    typeof err.message === "string" &&
    err.message.includes("Could not find the table")
  )
    return true;
  return false;
}

function tableMissingError(table: string): Error {
  return new Error(
    `Supabase table '${table}' not found. Run your database migrations (for example, prisma migrate deploy) to provision '${table}' before using this endpoint.`
  );
}

function handleSupabaseTableError(error: unknown, table: string): never {
  if (isSupabaseTableMissingError(error)) {
    throw tableMissingError(table);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("Unexpected Supabase error");
}

function isSupabaseUniqueConstraintError(
  error: unknown,
  constraint?: string
): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  if (err.code !== "23505") return false;
  if (!constraint) return true;

  const haystack = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
  return haystack.includes(constraint.toLowerCase());
}

function parseSocialLinks(
  value: Prisma.JsonValue | null | undefined
): Post["author"]["social_links"] {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, string>;
}

function mapCategory(category?: PostWithRelations["category"]): Category {
  if (!category) {
    return {
      id: "",
      slug: "uncategorized",
      name: "Uncategorized",
      description: undefined,
      post_count: 0,
    };
  }

  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? undefined,
    post_count: category.post_count,
    attributes: undefined,
  };
}

function transformAuthorModel(author: AuthorModel): Author {
  return {
    id: author.id,
    slug: author.slug,
    name: author.name,
    bio: author.bio ?? undefined,
    avatar: author.avatar ?? undefined,
    role: (author.role as Author["role"]) ?? "editor",
    social_links: parseSocialLinks(author.social_links),
  };
}

let fallbackAuthor: Author | null = null;
let fallbackAuthorPromise: Promise<Author | null | undefined> | null = null;

async function ensureFallbackAuthor() {
  if (fallbackAuthor) return fallbackAuthor;
  if (fallbackAuthorPromise) return fallbackAuthorPromise;

  fallbackAuthorPromise = (async () => {
    try {
      const firstAuthor = await prisma.author.findFirst({
        orderBy: { created_at: "asc" },
      });
      if (firstAuthor) {
        fallbackAuthor = transformAuthorModel(firstAuthor);
        return fallbackAuthor;
      }
    } catch (error) {
      console.warn(
        "[supabase-api] Unable to preload fallback author via Prisma – attempting Supabase fallback.",
        error
      );
    }

    try {
      const serviceClient = getServiceRoleClient();
      const { data, error } = await serviceClient
        .from("authors")
        .select("id, slug, name, bio, avatar, role, social_links")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) {
        handleSupabaseTableError(error, "authors");
      }
      const firstRow = Array.isArray(data) ? data[0] : data;
      if (firstRow) {
        fallbackAuthor = mapSupabaseAuthor(firstRow);
      }
    } catch (supabaseError) {
      console.warn(
        "[supabase-api] Unable to preload fallback author from Supabase service client.",
        supabaseError
      );
    }

    return fallbackAuthor;
  })();

  try {
    await fallbackAuthorPromise;
  } finally {
    fallbackAuthorPromise = null;
  }

  return fallbackAuthor;
}

function mapAuthorEntity(author?: AuthorModel | null): Author {
  if (!author) {
    void ensureFallbackAuthor();
    if (fallbackAuthor) {
      return fallbackAuthor;
    }
    return {
      id: "",
      slug: "unknown",
      name: "Unknown Author",
      role: "editor",
    };
  }

  return transformAuthorModel(author);
}

function mapPost(record: PostWithRelations): Post {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt ?? "",
    body_html: record.body_html,
    featured_image: record.featured_image ?? undefined,
    status: record.status as Post["status"],
    published_at: record.published_at?.toISOString(),
    scheduled_at: record.scheduled_at?.toISOString(),
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
    read_time: record.read_time ?? 0,
    is_featured: record.is_featured,
    page_type: ((record as any).page_type as "explore" | "faces") ?? "explore",
    views: record.analytics?.views_count ?? 0,
    author: mapAuthorEntity(record.author),
    category: mapCategory(record.category),
    tags:
      record.post_tags?.map((postTag) => ({
        id: postTag.tag.id,
        slug: postTag.tag.slug,
        name: postTag.tag.name,
      })) ?? [],
  };
}

function mapCommentEntity(comment: CommentWithRelations): Comment {
  const hasChildren = comment.replies && comment.replies.length > 0;
  return {
    id: comment.id,
    post_id: comment.post_id,
    parent_id: comment.parent_id ?? undefined,
    author_name: comment.author_name,
    body: comment.body,
    is_admin: comment.is_admin,
    admin: comment.admin ? transformAuthorModel(comment.admin) : undefined,
    post: comment.post
      ? {
          id: comment.post.id,
          slug: comment.post.slug,
          title: comment.post.title,
        }
      : undefined,
    replies:
      comment.replies?.map((reply) =>
        mapCommentEntity(reply as CommentWithRelations)
      ) ?? [],
    created_at: comment.created_at.toISOString(),
    updated_at: comment.updated_at.toISOString(),
    has_children: hasChildren,
  };
}

function normalizeSlug(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function createConflictError(message: string): Error {
  const error = new Error(message);
  (error as { status?: number }).status = 409;
  return error;
}

function isUniqueConstraintError(
  error: unknown,
  field: string
): error is PrismaClientKnownRequestError {
  if (
    error instanceof PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    if (Array.isArray(target)) {
      return target.includes(field);
    }
    if (typeof target === "string") {
      return target.includes(field);
    }
  }
  return false;
}

export async function getPosts(params?: {
  published?: boolean;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "views" | "title";
  status?: Post["status"];
  pageType?: "explore" | "faces";
}): Promise<Post[]> {
  return withPrismaFallback(
    async () => {
      const where: Prisma.PostWhereInput = {};

      if (params?.status) {
        where.status = params.status;
      } else if (params?.published) {
        where.status = "published";
      }

      if (params?.pageType) {
        (where as any).page_type = params.pageType;
      }

      if (params?.categoryId) {
        where.category_id = params.categoryId;
      }

      if (params?.categorySlug) {
        where.category = {
          slug: params.categorySlug,
        };
      }

      if (params?.search) {
        where.OR = [
          { title: { contains: params.search, mode: "insensitive" } },
          { excerpt: { contains: params.search, mode: "insensitive" } },
          { body_html: { contains: params.search, mode: "insensitive" } },
        ];
      }

      if (params?.tags?.length) {
        where.post_tags = {
          some: {
            tag_id: {
              in: params.tags,
            },
          },
        };
      }

      if (params?.dateFrom || params?.dateTo) {
        where.published_at = {};
        if (params.dateFrom) {
          where.published_at.gte = new Date(params.dateFrom);
        }
        if (params.dateTo) {
          where.published_at.lte = new Date(params.dateTo);
        }
      }

      let orderBy: Prisma.PostOrderByWithRelationInput = {
        published_at: "desc",
      };
      if (params?.sortBy === "views") {
        orderBy = { analytics: { views_count: "desc" } };
      } else if (params?.sortBy === "title") {
        orderBy = { title: "asc" };
      }

      const posts = await prisma.post.findMany({
        where,
        include: postInclude,
        orderBy,
        take: params?.limit ?? 20,
      });

      return posts.map(mapPost);
    },
    () => legacyGetPosts(params)
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  return withPrismaFallback(
    async () => {
      const post = await prisma.post.findUnique({
        where: { slug },
        include: postInclude,
      });

      if (!post) {
        return null;
      }

      return mapPost(post);
    },
    () => legacyGetPost(slug)
  );
}

export async function getPostById(id: string): Promise<Post | null> {
  return withPrismaFallback(
    async () => {
      const post = await prisma.post.findUnique({
        where: { id },
        include: postInclude,
      });

      if (!post) {
        return null;
      }

      return mapPost(post);
    },
    () => legacyGetPostById(id)
  );
}

export async function createPost(
  post: Partial<Post> & { author_id?: string }
): Promise<Post> {
  const normalizedSlug = normalizeSlug(post.slug);

  if (!normalizedSlug) {
    const error = new Error("Slug is required to create a post.");
    (error as { status?: number }).status = 400;
    throw error;
  }

  return withPrismaFallback(
    async () => {
      try {
        const existing = await prisma.post.findUnique({
          where: { slug: normalizedSlug },
        });

        if (existing) {
          throw createConflictError(
            "A post with this slug already exists. Please choose another slug."
          );
        }

        const createdPost = await prisma.$transaction(async (tx) => {
          const created = await tx.post.create({
            data: {
              title: post.title?.trim() ?? "",
              slug: normalizedSlug,
              excerpt: post.excerpt ?? "",
              body_html: post.body_html ?? "",
              featured_image: post.featured_image,
              author_id: post.author_id,
              category_id: post.category?.id,
              status: post.status ?? "draft",
              published_at: post.published_at
                ? new Date(post.published_at)
                : undefined,
              scheduled_at: post.scheduled_at
                ? new Date(post.scheduled_at)
                : undefined,
              is_featured: post.is_featured ?? false,
              page_type: post.page_type ?? "explore",
              read_time: post.read_time ?? 5,
            } as any,
          });

          if (post.tags?.length) {
            await tx.postTag.createMany({
              data: post.tags.map((tag) => ({
                post_id: created.id,
                tag_id: tag.id,
              })),
              skipDuplicates: true,
            });
          }

          await tx.analytics.upsert({
            where: { post_id: created.id },
            update: {},
            create: {
              post_id: created.id,
              views_count: post.views ?? 0,
              unique_visitors: 0,
            },
          });

          return tx.post.findUniqueOrThrow({
            where: { id: created.id },
            include: postInclude,
          });
        });

        return mapPost(createdPost);
      } catch (error) {
        if (isUniqueConstraintError(error, "slug")) {
          throw createConflictError(
            "A post with this slug already exists. Please choose another slug."
          );
        }
        throw error;
      }
    },
    () => legacyCreatePost({ ...post, slug: normalizedSlug })
  );
}

export async function updatePost(
  id: string,
  updates: Partial<Post>
): Promise<Post> {
  const normalizedSlug =
    updates.slug === undefined ? undefined : normalizeSlug(updates.slug);

  return withPrismaFallback(
    async () => {
      try {
        const updatedPost = await prisma.$transaction(async (tx) => {
          const updateData: any = {
            title: updates.title?.trim(),
            slug: normalizedSlug ?? updates.slug ?? undefined,
            excerpt: updates.excerpt,
            body_html: updates.body_html,
            featured_image: updates.featured_image,
            category_id: updates.category?.id,
            status: updates.status,
            published_at: updates.published_at
              ? new Date(updates.published_at)
              : undefined,
            scheduled_at:
              updates.scheduled_at === undefined
                ? undefined
                : updates.scheduled_at
                ? new Date(updates.scheduled_at)
                : null,
            is_featured: updates.is_featured ?? undefined,
            read_time: updates.read_time ?? undefined,
          };
          if (updates.page_type !== undefined) {
            updateData.page_type = updates.page_type;
          }
          const updated = await tx.post.update({
            where: { id },
            data: updateData,
          });

          if (updates.tags) {
            await tx.postTag.deleteMany({ where: { post_id: id } });
            if (updates.tags.length > 0) {
              await tx.postTag.createMany({
                data: updates.tags.map((tag) => ({
                  post_id: id,
                  tag_id: tag.id,
                })),
                skipDuplicates: true,
              });
            }
          }

          return tx.post.findUniqueOrThrow({
            where: { id: updated.id },
            include: postInclude,
          });
        });

        return mapPost(updatedPost);
      } catch (error) {
        if (isUniqueConstraintError(error, "slug")) {
          throw createConflictError(
            "A post with this slug already exists. Please choose another slug."
          );
        }
        throw error;
      }
    },
    () =>
      legacyUpdatePost(id, {
        ...updates,
        slug:
          normalizedSlug ??
          (updates.slug === undefined ? undefined : updates.slug),
      })
  );
}

export async function deletePost(id: string): Promise<void> {
  return withPrismaFallback(
    async () => {
      await prisma.$transaction(async (tx) => {
        await tx.postTag.deleteMany({ where: { post_id: id } });
        await tx.analytics.deleteMany({ where: { post_id: id } });
        await tx.post.delete({ where: { id } });
      });
    },
    () => legacyDeletePost(id)
  );
}

export async function getCategories(): Promise<Category[]> {
  return withPrismaFallback(
    async () => {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });

      return categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description ?? undefined,
        attributes: undefined,
        post_count: category.post_count,
      }));
    },
    () => legacyGetCategories()
  );
}

export async function createCategory(cat: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Category> {
  return withPrismaFallback(
    async () => {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        },
      });

      return {
        id: created.id,
        slug: created.slug,
        name: created.name,
        description: created.description ?? undefined,
        attributes: undefined,
        post_count: created.post_count,
      };
    },
    () => legacyCreateCategory(cat)
  );
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category> {
  return withPrismaFallback(
    async () => {
      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: updates.name,
          slug: updates.slug,
          description: updates.description,
        },
      });

      return {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        description: updated.description ?? undefined,
        attributes: undefined,
        post_count: updated.post_count,
      };
    },
    () => legacyUpdateCategory(id, updates)
  );
}

export async function deleteCategory(id: string): Promise<void> {
  return withPrismaFallback(
    async () => {
      await prisma.$transaction(async (tx) => {
        await tx.attribute.deleteMany({ where: { category_id: id } });
        await tx.post.updateMany({
          where: { category_id: id },
          data: { category_id: null },
        });
        await tx.category.delete({ where: { id } });
      });
    },
    () => legacyDeleteCategory(id)
  );
}

export async function getAttributes(categoryId?: string): Promise<Attribute[]> {
  return withPrismaFallback(
    async () => {
      const attributes = await prisma.attribute.findMany({
        where: categoryId ? { category_id: categoryId } : undefined,
        orderBy: { name: "asc" },
      });

      return attributes.map((attribute) => ({
        id: attribute.id,
        slug: attribute.slug,
        name: attribute.name,
        description: attribute.description ?? undefined,
        category_id: attribute.category_id,
      }));
    },
    () => legacyGetAttributes(categoryId)
  );
}

export async function createAttribute(
  attr: Omit<Attribute, "id">
): Promise<Attribute> {
  return withPrismaFallback(
    async () => {
      const created = await prisma.attribute.create({
        data: {
          name: attr.name,
          slug: attr.slug,
          description: attr.description,
          category_id: attr.category_id,
        },
      });

      return {
        id: created.id,
        slug: created.slug,
        name: created.name,
        description: created.description ?? undefined,
        category_id: created.category_id,
      };
    },
    () => legacyCreateAttribute(attr)
  );
}

export async function updateAttribute(
  id: string,
  updates: Partial<Attribute>
): Promise<Attribute> {
  return withPrismaFallback(
    async () => {
      const updated = await prisma.attribute.update({
        where: { id },
        data: {
          name: updates.name,
          slug: updates.slug,
          description: updates.description,
          category_id: updates.category_id,
        },
      });

      return {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        description: updated.description ?? undefined,
        category_id: updated.category_id,
      };
    },
    () => legacyUpdateAttribute(id, updates)
  );
}

export async function deleteAttribute(id: string): Promise<void> {
  return withPrismaFallback(
    async () => {
      await prisma.attribute.delete({ where: { id } });
    },
    () => legacyDeleteAttribute(id)
  );
}

export async function getTags(): Promise<Tag[]> {
  return withPrismaFallback(
    async () => {
      const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
      });

      return tags.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        name: tag.name,
      }));
    },
    () => legacyGetTags()
  );
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  return withPrismaFallback(
    async () => {
      const author = await prisma.author.findUnique({
        where: { slug },
      });

      if (!author) {
        return null;
      }

      return mapAuthorEntity(author);
    },
    () => legacyGetAuthorBySlug(slug)
  );
}

export async function getAuthorById(id: string): Promise<Author | null> {
  return withPrismaFallback(
    async () => {
      const author = await prisma.author.findUnique({
        where: { id },
      });

      if (!author) {
        return null;
      }

      return mapAuthorEntity(author);
    },
    () => legacyGetAuthorById(id)
  );
}

export async function getAuthors(): Promise<Author[]> {
  return withPrismaFallback(
    async () => {
      const authors = await prisma.author.findMany({
        orderBy: { name: "asc" },
      });

      return authors.map((author) => mapAuthorEntity(author));
    },
    () => legacyGetAuthors()
  );
}

type AuthorInput = {
  name: string;
  slug: string;
  role: Author["role"];
  bio?: string | null;
  avatar?: string | null;
};

type AuthorCreateInput = AuthorInput & { password: string };
type AuthorUpdateInput = Partial<AuthorInput> & { password?: string };

async function createAuthIdentity(
  input: AuthorCreateInput
): Promise<{ id: string }> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.slug,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.name,
      role: input.role,
      bio: input.bio ?? null,
      avatar_url: input.avatar ?? null,
    },
    app_metadata: {
      role: input.role,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create Supabase auth user");
  }

  return { id: data.user.id };
}

async function syncAuthIdentity(author: Author, password?: string) {
  const supabase = getServiceRoleClient();
  const payload: Parameters<typeof supabase.auth.admin.updateUserById>[1] = {
    email: author.slug,
    user_metadata: {
      display_name: author.name,
      role: author.role,
      bio: author.bio ?? null,
      avatar_url: author.avatar ?? null,
    },
    app_metadata: {
      role: author.role,
    },
  };

  if (password) {
    payload.password = password;
  }

  const { error } = await supabase.auth.admin.updateUserById(
    author.id,
    payload
  );

  if (error) {
    throw new Error(error.message ?? "Failed to update Supabase auth user");
  }
}

async function deleteAuthIdentity(id: string) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (
    error &&
    !(
      "status" in error &&
      ((error as { status?: number }).status === 404 ||
        (error as { status?: number }).status === 422)
    )
  ) {
    throw new Error(error.message ?? "Failed to delete Supabase auth user");
  }
}

export async function createAuthor(input: AuthorCreateInput): Promise<Author> {
  const sanitizedName = input.name.trim();
  const email = input.slug.trim().toLowerCase();
  const authIdentity = await createAuthIdentity({
    ...input,
    name: sanitizedName,
    slug: email,
  });

  const dbPayload = {
    id: authIdentity.id,
    name: sanitizedName,
    slug: email,
    role: input.role,
    bio: input.bio ?? null,
    avatar: input.avatar ?? null,
  };

  try {
    const author = await withPrismaFallback(
      async () => {
        const created = await prisma.author.create({
          data: dbPayload,
        });

        return mapAuthorEntity(created);
      },
      () => legacyCreateAuthor(dbPayload)
    );

    return author;
  } catch (error) {
    await deleteAuthIdentity(authIdentity.id).catch(() => undefined);
    throw error;
  }
}

export async function updateAuthor(
  id: string,
  updates: AuthorUpdateInput
): Promise<Author> {
  const updateData: Prisma.AuthorUpdateInput = {};

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.slug !== undefined)
    updateData.slug = updates.slug.trim().toLowerCase();
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.bio !== undefined) updateData.bio = updates.bio ?? null;
  if (updates.avatar !== undefined) updateData.avatar = updates.avatar ?? null;

  const author = await withPrismaFallback(
    async () => {
      const updated = await prisma.author.update({
        where: { id },
        data: updateData,
      });

      return mapAuthorEntity(updated);
    },
    () =>
      legacyUpdateAuthor(id, {
        name: updates.name?.trim(),
        slug: updates.slug?.trim().toLowerCase(),
        role: updates.role,
        bio: updates.bio ?? null,
        avatar: updates.avatar ?? null,
      })
  );

  await syncAuthIdentity(author, updates.password);

  return author;
}

export async function deleteAuthor(id: string): Promise<void> {
  await withPrismaFallback(
    async () => {
      await prisma.author.delete({ where: { id } });
    },
    () => legacyDeleteAuthor(id)
  );

  await deleteAuthIdentity(id);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return withPrismaFallback(
    async () => {
      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        analyticsSum,
        totalUsers,
      ] = await prisma.$transaction([
        prisma.post.count(),
        prisma.post.count({ where: { status: "published" } }),
        prisma.post.count({ where: { status: "draft" } }),
        prisma.post.count({ where: { status: "scheduled" } }),
        prisma.analytics.aggregate({ _sum: { views_count: true } }),
        prisma.author.count(),
      ]);

      return {
        total_posts: totalPosts,
        published_posts: publishedPosts,
        draft_posts: draftPosts,
        scheduled_posts: scheduledPosts,
        total_views: analyticsSum._sum.views_count ?? 0,
        total_users: totalUsers,
      };
    },
    () => legacyGetDashboardStats()
  );
}

export async function trackPageView(postId: string): Promise<void> {
  return withPrismaFallback(
    async () => {
      await prisma.analytics.upsert({
        where: { post_id: postId },
        update: {
          views_count: { increment: 1 },
        },
        create: {
          post_id: postId,
          views_count: 1,
          unique_visitors: 1,
        },
      });
    },
    () => legacyTrackPageView(postId)
  );
}

export async function uploadPostImage(file: File): Promise<string> {
  return uploadImage(file);
}

export async function getCommentsForPost(postId: string): Promise<Comment[]> {
  return withPrismaFallback(
    async () => {
      const comments = await prisma.comment.findMany({
        where: {
          post_id: postId,
          parent_id: null,
        },
        include: {
          admin: true,
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          replies: {
            include: {
              admin: true,
              post: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
            orderBy: [{ created_at: "asc" }],
          },
        },
        orderBy: { created_at: "desc" },
      });

      return comments.map(mapCommentEntity);
    },
    () => legacyGetCommentsForPost(postId)
  );
}

export async function createComment(input: {
  postId: string;
  authorName: string;
  body: string;
  parentId?: string;
  adminId?: string;
  isAdmin?: boolean;
}): Promise<Comment> {
  return withPrismaFallback(
    async () => {
      const created = await prisma.comment.create({
        data: {
          post_id: input.postId,
          author_name: input.authorName,
          body: input.body,
          parent_id: input.parentId ?? null,
          admin_id: input.adminId ?? null,
          is_admin: input.isAdmin ?? false,
        },
        include: {
          admin: true,
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          replies: {
            include: {
              admin: true,
              post: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
            orderBy: [{ created_at: "asc" }],
          },
        },
      });

      return mapCommentEntity(created as CommentWithRelations);
    },
    () => legacyCreateComment(input)
  );
}

export async function getRecentComments(limit = 10): Promise<Comment[]> {
  return withPrismaFallback(
    async () => {
      const comments = await prisma.comment.findMany({
        where: {
          parent_id: null,
        },
        include: {
          admin: true,
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          replies: {
            include: {
              admin: true,
              post: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
            orderBy: [{ created_at: "asc" }],
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return comments.map(mapCommentEntity);
    },
    () => legacyGetRecentComments(limit)
  );
}

export async function deleteComment(id: string): Promise<void> {
  await withPrismaFallback(
    async () => {
      const idsToDelete: string[] = [];
      let queue: string[] = [id];

      while (queue.length > 0) {
        const chunk = queue.splice(0, 50);
        idsToDelete.push(...chunk);

        const children = await prisma.comment.findMany({
          where: { parent_id: { in: chunk } },
          select: { id: true },
        });

        if (children.length > 0) {
          queue.push(...children.map((child) => child.id));
        }
      }

      if (idsToDelete.length > 0) {
        await prisma.comment.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    },
    () => legacyDeleteComment(id)
  );
}

export async function getCommentById(id: string): Promise<Comment | null> {
  return withPrismaFallback(
    async () => {
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
          admin: true,
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          replies: {
            include: {
              admin: true,
              post: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
            orderBy: [{ created_at: "asc" }],
          },
        },
      });

      if (!comment) return null;
      return mapCommentEntity(comment as CommentWithRelations);
    },
    () => legacyGetCommentById(id)
  );
}
// ------------------------------
// Supabase fallbacks
// ------------------------------

let legacyTagCache: Tag[] | null = null;

function mapSupabaseAuthor(row: any): Author {
  const safeRow = row ?? {};
  if ((!safeRow.id || !safeRow.name) && !fallbackAuthor) {
    void ensureFallbackAuthor();
  }
  if ((!safeRow.id || !safeRow.name) && fallbackAuthor) {
    return fallbackAuthor;
  }
  return {
    id: safeRow.id ?? "",
    slug: safeRow.slug ?? "unknown",
    name: safeRow.name ?? "Unknown Author",
    bio: safeRow.bio ?? undefined,
    avatar: safeRow.avatar ?? undefined,
    role: (safeRow.role as Author["role"]) ?? "editor",
    social_links: safeRow.social_links ?? undefined,
  };
}

function mapSupabaseCategory(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    attributes: undefined,
    post_count: row.post_count ?? 0,
  };
}

function mapSupabaseComment(row: any): Comment {
  return {
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id ?? undefined,
    author_name: row.author_name,
    body: row.body,
    is_admin: row.is_admin ?? false,
    admin: row.admin ? mapSupabaseAuthor(row.admin) : undefined,
    post: row.post
      ? {
          id: row.post.id,
          slug: row.post.slug,
          title: row.post.title,
        }
      : undefined,
    replies: Array.isArray(row.replies)
      ? row.replies.map((reply: any) => mapSupabaseComment(reply))
      : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function legacyGetTagsWithCache() {
  if (!legacyTagCache) {
    const client = await createServerClient();
    const { data, error } = await client.from("tags").select("*");
    if (error) {
      handleSupabaseTableError(error, "tags");
    }
    legacyTagCache = (data as Tag[]) || [];
  }
  return legacyTagCache;
}

async function legacyGetPosts(params?: {
  published?: boolean;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "views" | "title";
  status?: Post["status"];
  pageType?: "explore" | "faces";
}): Promise<Post[]> {
  const client = await createServerClient();
  let query = client.from("posts").select(
    `
      id, slug, title, excerpt, body_html, featured_image, status,
      published_at, scheduled_at, created_at, updated_at, read_time, is_featured, page_type,
      author_id, category_id,
      authors(id, slug, name, bio, avatar, role, social_links),
      categories(id, slug, name, description, post_count),
      post_tags(tag_id),
      analytics(views_count)
    `
  );

  if (params?.status) {
    query = query.eq("status", params.status);
  } else if (params?.published) {
    query = query.eq("status", "published");
  }

  if (params?.pageType) {
    query = query.eq("page_type", params.pageType);
  }

  let categoryId = params?.categoryId;
  if (!categoryId && params?.categorySlug) {
    const { data: categoryRow, error: categoryError } = await client
      .from("categories")
      .select("id")
      .eq("slug", params.categorySlug)
      .single();
    if (categoryError) {
      if (categoryError.code === "PGRST116") {
        categoryId = undefined;
      } else {
        handleSupabaseTableError(categoryError, "categories");
      }
    } else {
      categoryId = categoryRow?.id;
    }
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (params?.search) {
    query = query.or(
      `title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`
    );
  }

  if (params?.dateFrom) {
    query = query.gte("published_at", params.dateFrom);
  }

  if (params?.dateTo) {
    query = query.lte("published_at", params.dateTo);
  }

  if (params?.sortBy === "views") {
    query = query.order("views", {
      referencedTable: "analytics",
      ascending: false,
    });
  } else if (params?.sortBy === "title") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("published_at", {
      ascending: false,
      nullsFirst: false,
    });
  }

  const limit = params?.limit || 20;
  const { data, error } = await query.limit(limit);
  if (error) {
    handleSupabaseTableError(error, "posts");
  }

  await ensureFallbackAuthor();

  const allTags = await legacyGetTagsWithCache();

  const posts: Post[] = [];
  for (const row of (data as any[]) || []) {
    const postTags = (row.post_tags || [])
      .map((pt: any) => allTags.find((t) => t.id === pt.tag_id))
      .filter(Boolean) as Tag[];
    const analytics = (row.analytics && row.analytics[0]) || { views_count: 0 };

    posts.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? "",
      body_html: row.body_html,
      featured_image: row.featured_image ?? undefined,
      status: row.status,
      published_at: row.published_at,
      scheduled_at: row.scheduled_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      read_time: row.read_time ?? 0,
      is_featured: row.is_featured ?? false,
      page_type: row.page_type ?? "explore",
      views: analytics.views_count || 0,
      author: mapSupabaseAuthor(row.authors),
      category: mapSupabaseCategory(row.categories),
      tags: postTags,
    });
  }

  if (params?.tags?.length) {
    const tagSet = new Set(params.tags);
    return posts.filter((post) => post.tags.some((tag) => tagSet.has(tag.id)));
  }

  return posts;
}

async function legacyFetchPost(
  identifier: string,
  by: "slug" | "id" = "slug"
): Promise<Post | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("posts")
    .select(
      `
        id, slug, title, excerpt, body_html, featured_image, status,
        published_at, scheduled_at, created_at, updated_at, read_time, is_featured,
        authors(id, slug, name, bio, avatar, role, social_links),
        categories(id, slug, name, description, post_count),
        post_tags(tag_id),
        analytics(views_count)
      `
    )
    .eq(by, identifier)
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") {
      return null;
    }
    handleSupabaseTableError(error, "posts");
  }

  if (!data) return null;

  await ensureFallbackAuthor();

  const allTags = await legacyGetTagsWithCache();
  const postTags = ((data as any).post_tags || [])
    .map((pt: any) => allTags.find((t) => t.id === pt.tag_id))
    .filter(Boolean) as Tag[];
  const analytics =
    (data as any).analytics && (data as any).analytics[0]
      ? { views_count: (data as any).analytics[0].views_count }
      : { views_count: 0 };

  return {
    id: (data as any).id,
    slug: (data as any).slug,
    title: (data as any).title,
    excerpt: (data as any).excerpt,
    body_html: (data as any).body_html,
    featured_image: (data as any).featured_image ?? undefined,
    status: (data as any).status,
    published_at: (data as any).published_at,
    scheduled_at: (data as any).scheduled_at,
    created_at: (data as any).created_at,
    updated_at: (data as any).updated_at,
    read_time: (data as any).read_time ?? 0,
    is_featured: (data as any).is_featured ?? false,
    views: analytics.views_count || 0,
    author: mapSupabaseAuthor((data as any).authors),
    category: mapSupabaseCategory((data as any).categories),
    tags: postTags,
  };
}

function legacyGetPostById(id: string) {
  return legacyFetchPost(id, "id");
}

function legacyGetPost(slug: string) {
  return legacyFetchPost(slug, "slug");
}

async function legacyCreatePost(
  post: Partial<Post> & { author_id?: string }
): Promise<Post> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("posts")
    .insert({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body_html: post.body_html,
      featured_image: post.featured_image,
      author_id: post.author_id,
      category_id: post.category?.id,
      status: post.status || "draft",
      published_at: post.published_at,
      scheduled_at: post.scheduled_at,
      is_featured: post.is_featured || false,
      read_time: post.read_time || 5,
    })
    .select()
    .single();

  if (error) {
    if (isSupabaseUniqueConstraintError(error, "posts_slug_key")) {
      throw createConflictError(
        "A post with this slug already exists. Please choose another slug."
      );
    }
    handleSupabaseTableError(error, "posts");
  }

  if (post.tags && post.tags.length > 0) {
    const { error: tagsError } = await client
      .from("post_tags")
      .insert(
        post.tags.map((tag) => ({ post_id: (data as any).id, tag_id: tag.id }))
      );
    if (tagsError) {
      handleSupabaseTableError(tagsError, "post_tags");
    }
  }

  const { error: analyticsError } = await client.from("analytics").insert({
    post_id: (data as any).id,
    views_count: 0,
    unique_visitors: 0,
  });
  if (analyticsError) {
    handleSupabaseTableError(analyticsError, "analytics");
  }

  return (await legacyFetchPost((data as any).slug)) as Post;
}

async function legacyUpdatePost(
  id: string,
  updates: Partial<Post>
): Promise<Post> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("posts")
    .update({
      title: updates.title,
      slug: updates.slug,
      excerpt: updates.excerpt,
      body_html: updates.body_html,
      featured_image: updates.featured_image,
      category_id: updates.category?.id,
      status: updates.status,
      published_at: updates.published_at,
      scheduled_at: updates.scheduled_at,
      is_featured: updates.is_featured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (isSupabaseUniqueConstraintError(error, "posts_slug_key")) {
      throw createConflictError(
        "A post with this slug already exists. Please choose another slug."
      );
    }
    handleSupabaseTableError(error, "posts");
  }

  if (updates.tags) {
    const { error: deleteTagsError } = await client
      .from("post_tags")
      .delete()
      .eq("post_id", id);
    if (deleteTagsError) {
      handleSupabaseTableError(deleteTagsError, "post_tags");
    }
    if (updates.tags.length > 0) {
      const { error: insertTagsError } = await client
        .from("post_tags")
        .insert(updates.tags.map((tag) => ({ post_id: id, tag_id: tag.id })));
      if (insertTagsError) {
        handleSupabaseTableError(insertTagsError, "post_tags");
      }
    }
  }

  return (await legacyFetchPost((data as any).slug)) as Post;
}

async function legacyDeletePost(id: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.from("posts").delete().eq("id", id);
  if (error) {
    handleSupabaseTableError(error, "posts");
  }
}

async function legacyGetCategories(): Promise<Category[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name");
  if (error) {
    handleSupabaseTableError(error, "categories");
  }
  return ((data as any[]) || []).map(mapSupabaseCategory);
}

async function legacyCreateCategory(cat: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Category> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("categories")
    .insert(cat)
    .select()
    .single();
  if (error) {
    handleSupabaseTableError(error, "categories");
  }
  return mapSupabaseCategory(data);
}

async function legacyUpdateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    handleSupabaseTableError(error, "categories");
  }
  return mapSupabaseCategory(data);
}

async function legacyDeleteCategory(id: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) {
    handleSupabaseTableError(error, "categories");
  }
}

async function legacyGetAttributes(categoryId?: string): Promise<Attribute[]> {
  const client = await createServerClient();
  let query = client.from("attributes").select("*");
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const { data, error } = await query;
  if (error) {
    handleSupabaseTableError(error, "attributes");
  }
  return ((data as any[]) || []).map((attribute) => ({
    id: attribute.id,
    slug: attribute.slug,
    name: attribute.name,
    description: attribute.description ?? undefined,
    category_id: attribute.category_id,
  }));
}

async function legacyCreateAttribute(
  attr: Omit<Attribute, "id">
): Promise<Attribute> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("attributes")
    .insert(attr)
    .select()
    .single();
  if (error) {
    handleSupabaseTableError(error, "attributes");
  }
  return {
    id: (data as any).id,
    slug: (data as any).slug,
    name: (data as any).name,
    description: (data as any).description ?? undefined,
    category_id: (data as any).category_id,
  };
}

async function legacyUpdateAttribute(
  id: string,
  updates: Partial<Attribute>
): Promise<Attribute> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("attributes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    handleSupabaseTableError(error, "attributes");
  }
  return {
    id: (data as any).id,
    slug: (data as any).slug,
    name: (data as any).name,
    description: (data as any).description ?? undefined,
    category_id: (data as any).category_id,
  };
}

async function legacyDeleteAttribute(id: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.from("attributes").delete().eq("id", id);
  if (error) {
    handleSupabaseTableError(error, "attributes");
  }
}

async function legacyGetTags(): Promise<Tag[]> {
  const client = await createServerClient();
  const { data, error } = await client.from("tags").select("*").order("name");
  if (error) {
    handleSupabaseTableError(error, "tags");
  }
  return ((data as any[]) || []).map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
  }));
}

async function legacyGetAuthorBySlug(slug: string): Promise<Author | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("authors")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    handleSupabaseTableError(error, "authors");
  }
  return data ? mapSupabaseAuthor(data) : null;
}

async function legacyGetAuthorById(id: string): Promise<Author | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("authors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    handleSupabaseTableError(error, "authors");
  }
  return data ? mapSupabaseAuthor(data) : null;
}

async function legacyGetAuthors(): Promise<Author[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("authors")
    .select("*")
    .order("name");
  if (error) {
    handleSupabaseTableError(error, "authors");
  }
  return ((data as any[]) || []).map(mapSupabaseAuthor);
}

async function legacyCreateAuthor(
  input: AuthorInput & { id: string }
): Promise<Author> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("authors")
    .insert({
      id: input.id,
      name: input.name,
      slug: input.slug,
      role: input.role,
      bio: input.bio ?? null,
      avatar: input.avatar ?? null,
    })
    .select("*")
    .single();

  if (error) {
    handleSupabaseTableError(error, "authors");
  }

  return mapSupabaseAuthor(data);
}

async function legacyUpdateAuthor(
  id: string,
  updates: Partial<AuthorInput>
): Promise<Author> {
  const client = await createServerClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.slug !== undefined) updatePayload.slug = updates.slug;
  if (updates.role !== undefined) updatePayload.role = updates.role;
  if (updates.bio !== undefined) updatePayload.bio = updates.bio;
  if (updates.avatar !== undefined) updatePayload.avatar = updates.avatar;

  const { data, error } = await client
    .from("authors")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    handleSupabaseTableError(error, "authors");
  }

  return mapSupabaseAuthor(data);
}

async function legacyDeleteAuthor(id: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.from("authors").delete().eq("id", id);

  if (error) {
    handleSupabaseTableError(error, "authors");
  }
}

async function legacyGetDashboardStats(): Promise<DashboardStats> {
  const client = await createServerClient();
  const { data: postsData, error: postsError } = await client
    .from("posts")
    .select("*");
  if (postsError) {
    handleSupabaseTableError(postsError, "posts");
  }
  const { data: viewsData, error: viewsError } = await client
    .from("analytics")
    .select("*");
  if (viewsError) {
    handleSupabaseTableError(viewsError, "analytics");
  }
  const { count: authorsCount, error: authorsError } = await client
    .from("authors")
    .select("*", { count: "exact", head: true });
  if (authorsError) {
    handleSupabaseTableError(authorsError, "authors");
  }

  const posts = (postsData as any[]) || [];
  const views = (viewsData as any[]) || [];

  return {
    total_posts: posts.length,
    published_posts: posts.filter((p) => p.status === "published").length,
    draft_posts: posts.filter((p) => p.status === "draft").length,
    scheduled_posts: posts.filter((p) => p.status === "scheduled").length,
    total_views: views.reduce((sum, v) => sum + (v.views_count || 0), 0),
    total_users: authorsCount ?? 0,
  };
}

async function legacyTrackPageView(postId: string): Promise<void> {
  const client = createBrowserClient();
  const { data, error } = await client
    .from("analytics")
    .select("id, views_count")
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    if (isSupabaseTableMissingError(error)) {
      console.warn(tableMissingError("analytics").message);
      return;
    }
    console.error("Failed to fetch analytics via Supabase fallback:", error);
    return;
  }

  if (data) {
    const { error: updateError } = await client
      .from("analytics")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", data.id);

    if (updateError) {
      if (isSupabaseTableMissingError(updateError)) {
        console.warn(tableMissingError("analytics").message);
        return;
      }
      console.error(
        "Failed to update analytics via Supabase fallback:",
        updateError
      );
    }
  } else {
    const { error: insertError } = await client
      .from("analytics")
      .insert({ post_id: postId, views_count: 1, unique_visitors: 1 });

    if (insertError) {
      if (isSupabaseTableMissingError(insertError)) {
        console.warn(tableMissingError("analytics").message);
        return;
      }
      console.error(
        "Failed to insert analytics via Supabase fallback:",
        insertError
      );
    }
  }
}

async function legacyGetCommentsForPost(postId: string): Promise<Comment[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("comments")
    .select(
      `
        id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
        admin:authors(id, slug, name, bio, avatar, role, social_links),
        post:posts(id, slug, title),
        replies:comments!comments_parent_id_fkey(
          id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
          admin:authors(id, slug, name, bio, avatar, role, social_links),
          post:posts(id, slug, title)
        )
      `
    )
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .order("created_at", { ascending: true, referencedTable: "replies" });

  if (error) {
    handleSupabaseTableError(error, "comments");
  }

  await ensureFallbackAuthor();

  return ((data as any[]) || []).map((row) => mapSupabaseComment(row));
}

async function legacyCreateComment(input: {
  postId: string;
  authorName: string;
  body: string;
  parentId?: string;
  adminId?: string;
  isAdmin?: boolean;
}): Promise<Comment> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("comments")
    .insert({
      post_id: input.postId,
      parent_id: input.parentId ?? null,
      author_name: input.authorName,
      body: input.body,
      is_admin: input.isAdmin ?? false,
      admin_id: input.adminId ?? null,
    })
    .select(
      `
        id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
        admin:authors(id, slug, name, bio, avatar, role, social_links),
        post:posts(id, slug, title),
        replies:comments!comments_parent_id_fkey(
          id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
          admin:authors(id, slug, name, bio, avatar, role, social_links),
          post:posts(id, slug, title)
        )
      `
    )
    .single();

  if (error) {
    handleSupabaseTableError(error, "comments");
  }

  return mapSupabaseComment(data);
}

async function legacyGetRecentComments(limit = 10): Promise<Comment[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("comments")
    .select(
      `
        id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
        admin:authors(id, slug, name, bio, avatar, role, social_links),
        post:posts(id, slug, title),
        replies:comments!comments_parent_id_fkey(
          id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
          admin:authors(id, slug, name, bio, avatar, role, social_links),
          post:posts(id, slug, title)
        )
      `
    )
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseTableError(error, "comments");
  }

  await ensureFallbackAuthor();

  return ((data as any[]) || []).map((row) => mapSupabaseComment(row));
}

async function legacyGetCommentById(id: string): Promise<Comment | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("comments")
    .select(
      `
        id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
        admin:authors(id, slug, name, bio, avatar, role, social_links),
        post:posts(id, slug, title),
        replies:comments!comments_parent_id_fkey(
          id, post_id, parent_id, author_name, body, is_admin, admin_id, created_at, updated_at,
          admin:authors(id, slug, name, bio, avatar, role, social_links),
          post:posts(id, slug, title)
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") {
      return null;
    }
    handleSupabaseTableError(error, "comments");
  }

  if (!data) return null;
  return mapSupabaseComment(data);
}

async function legacyDeleteComment(id: string): Promise<void> {
  const client = await createServerClient();
  const idsToDelete: string[] = [];
  let queue: string[] = [id];

  while (queue.length > 0) {
    const chunk = queue.splice(0, 50);
    idsToDelete.push(...chunk);

    const { data, error } = await client
      .from("comments")
      .select("id")
      .in("parent_id", chunk);
    if (error) {
      handleSupabaseTableError(error, "comments");
    }
    if (data && data.length > 0) {
      queue.push(...(data as { id: string }[]).map((row) => row.id));
    }
  }

  if (idsToDelete.length === 0) return;

  const { error: deleteError } = await client
    .from("comments")
    .delete()
    .in("id", idsToDelete);
  if (deleteError) {
    handleSupabaseTableError(deleteError, "comments");
  }
}
