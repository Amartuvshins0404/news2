import type {
  Attribute,
  Author,
  Category,
  Comment,
  DashboardStats,
  LoginResponse,
  MediaFile,
  Post,
  Tag,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function buildQuery(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.join(","));
      }
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const raw = await response.text();
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new Error(
        raw?.trim().length
          ? raw.trim()
          : `API Error (${response.status}): ${response.statusText || "Unexpected response"}`
      );
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error && typeof parsed.error === "string") {
        throw new Error(parsed.error);
      }
      if (parsed?.message && typeof parsed.message === "string") {
        throw new Error(parsed.message);
      }
      throw new Error(raw || `API Error: ${response.statusText}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== raw) {
        throw parseError;
      }
      throw new Error(raw || `API Error: ${response.statusText}`);
    }
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  // Public API - Posts
  async getPosts(params?: {
    published?: boolean;
    limit?: number;
    cursor?: string;
    categorySlug?: string;
    search?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    sortBy?: "date" | "views" | "title";
    status?: Post["status"];
    pageType?: "explore" | "faces";
    revalidate?: number | false;
  }) {
    try {
      const { revalidate, ...queryParams } = params ?? {};
      const query = buildQuery({
        published: params?.published,
        limit: params?.limit,
        categorySlug: params?.categorySlug,
        search: params?.search,
        tags: params?.tags,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        sortBy: params?.sortBy,
        status: params?.status,
        pageType: params?.pageType,
      });
      const response = await request<{ data: Post[]; pagination: null }>(
        `/posts${query}`,
        revalidate !== undefined
          ? {
              next: {
                revalidate: revalidate,
              },
            }
          : undefined
      );
      return response;
    } catch (error) {
      console.error("Error fetching posts:", error);
      return { data: [], pagination: null };
    }
  },

  async getPost(slug: string) {
    try {
      const post = await request<Post>(`/posts/slug/${slug}`);
      return post;
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  },

  async getCategories() {
    try {
      return await request<Category[]>("/categories");
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async getTags() {
    try {
      return await request<Tag[]>("/tags");
    } catch (error) {
      console.error("Error fetching tags:", error);
      return [];
    }
  },

  async getAuthor(slug: string) {
    try {
      return await request<Author>(`/authors/${slug}`);
    } catch (error) {
      console.error("Error fetching author:", error);
      return null;
    }
  },

  // Admin API
  async login(email: string, password: string) {
    try {
      return await request<LoginResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      return await request<DashboardStats>("/dashboard");
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        total_posts: 0,
        published_posts: 0,
        draft_posts: 0,
        scheduled_posts: 0,
        total_views: 0,
        total_users: 0,
      };
    }
  },

  async getAdminPosts(status?: string) {
    try {
      const query = buildQuery({ status });
      const response = await request<{ data: Post[]; pagination: null }>(
        `/posts${query}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      return [];
    }
  },

  async createPost(post: Partial<Post>) {
    try {
      return await request<Post>("/posts", {
        method: "POST",
        body: JSON.stringify(post),
      });
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  async updatePost(id: string, updates: Partial<Post>) {
    try {
      return await request<Post>(`/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },

  async deletePost(id: string) {
    try {
      await request<{ success: boolean }>(`/posts/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

  async getPostComments(slug: string) {
    try {
      return await request<Comment[]>(`/posts/slug/${slug}/comments`);
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  },

  async addComment(slug: string, input: { name: string; body: string; parentId?: string }) {
    try {
      return await request<Comment>(`/posts/slug/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  async getRecentComments(limit = 10) {
    try {
      return await request<Comment[]>(`/comments?limit=${limit}`);
    } catch (error) {
      console.error("Error fetching recent comments:", error);
      return [];
    }
  },

  async getAdminCommentsForPost(postId: string) {
    try {
      return await request<Comment[]>(`/comments?postId=${postId}`);
    } catch (error) {
      console.error("Error fetching admin comments:", error);
      throw error;
    }
  },

  async replyToComment(commentId: string, body: string) {
    try {
      return await request<Comment>(`/comments/${commentId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  },

  async deleteComment(commentId: string) {
    try {
      return await request<{ success: boolean; comments: Comment[] }>(
        `/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  async trackPostView(slug: string) {
    try {
      await request<{ success: boolean }>(`/posts/slug/${slug}/view`, {
        method: "POST",
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to track view:", error);
      }
    }
  },

  async uploadMedia(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/media`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const raw = await response.text();
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error && typeof parsed.error === "string") {
            throw new Error(parsed.error);
          }
          throw new Error(raw || `Upload failed (${response.status})`);
        } catch {
          throw new Error(raw || `Upload failed (${response.status})`);
        }
      }

      const media = (await response.json()) as MediaFile;
      return media;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  },

  async getMedia(signal?: AbortSignal) {
    try {
      return await request<MediaFile[]>("/media", { signal });
    } catch (error) {
      console.error("Error fetching media:", error);
      throw error;
    }
  },

  async deleteMedia(id: string) {
    try {
      await request<{ success: boolean }>("/media", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  },

  async getUsers() {
    try {
      return await request<Author[]>("/users");
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async createUser(user: {
    name: string;
    slug: string;
    role: Author["role"];
    bio?: string | null;
    avatar?: string | null;
    password: string;
  }) {
    try {
      return await request<Author>("/users", {
        method: "POST",
        body: JSON.stringify(user),
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(
    id: string,
    updates: Partial<{
      name: string;
      slug: string;
      role: Author["role"];
      bio?: string | null;
      avatar?: string | null;
      password?: string;
    }>
  ) {
    try {
      return await request<Author>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async deleteUser(id: string) {
    try {
      await request<{ success: boolean }>(`/users/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  async getAdminCategories() {
    return this.getCategories();
  },

  async createCategory(category: {
    name: string;
    slug: string;
    description?: string;
  }) {
    try {
      return await request<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(category),
      });
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async updateCategory(
    id: string,
    updates: { name?: string; slug?: string; description?: string }
  ) {
    try {
      return await request<Category>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    try {
      await request<{ success: boolean }>(`/categories/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async getAdminAttributes(categoryId?: string) {
    try {
      const query = buildQuery({ categoryId });
      return await request<Attribute[]>(`/attributes${query}`);
    } catch (error) {
      console.error("Error fetching attributes:", error);
      return [];
    }
  },

  async createAttribute(attribute: {
    name: string;
    slug: string;
    description?: string;
    category_id: string;
  }) {
    try {
      return await request<Attribute>("/attributes", {
        method: "POST",
        body: JSON.stringify(attribute),
      });
    } catch (error) {
      console.error("Error creating attribute:", error);
      throw error;
    }
  },

  async updateAttribute(
    id: string,
    updates: {
      name?: string;
      slug?: string;
      description?: string;
      category_id?: string;
    }
  ) {
    try {
      return await request<Attribute>(`/attributes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error updating attribute:", error);
      throw error;
    }
  },

  async deleteAttribute(id: string) {
    try {
      await request<{ success: boolean }>(`/attributes/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting attribute:", error);
      throw error;
    }
  },
};
