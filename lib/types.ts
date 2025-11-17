export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_html: string;
  featured_image?: string;
  author: Author;
  category: Category;
  tags: Tag[];
  status: "draft" | "scheduled" | "published";
  published_at?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  read_time: number;
  views: number;
  is_featured: boolean;
  page_type?: "explore" | "faces";
  comments?: Comment[];
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  role: "admin" | "editor" | "contributor";
  social_links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Attribute {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category_id: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  attributes?: Attribute[];
  post_count: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  author_name: string;
  body: string;
  is_admin: boolean;
  admin?: Author;
  replies: Comment[];
  post?: {
    id: string;
    slug: string;
    title: string;
  };
  created_at: string;
  updated_at: string;
  has_children?: boolean;
}

export interface MediaFile {
  id: string;
  path?: string;
  url: string;
  filename: string;
  mimetype: string | null;
  size: number;
  created_at: string;
}

export interface DashboardStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  scheduled_posts: number;
  total_views: number;
  total_users: number;
}

export interface ApiResponse<T> {
  data: T;
  nextCursor?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: Author;
}
