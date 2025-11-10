import type {
  Post,
  Author,
  Category,
  Tag,
  MediaFile,
  DashboardStats,
  ApiResponse,
  LoginResponse,
  Attribute,
} from "./types"

const mockAuthors: Author[] = [
  {
    id: "1",
    slug: "john-doe",
    name: "John Doe",
    bio: "Senior technology journalist with 10 years of experience",
    avatar: "/professional-male-avatar.png",
    role: "editor",
    social_links: {
      twitter: "https://twitter.com/johndoe",
      linkedin: "https://linkedin.com/in/johndoe",
    },
  },
  {
    id: "2",
    slug: "jane-smith",
    name: "Jane Smith",
    bio: "Business and finance reporter",
    avatar: "/professional-female-avatar.png",
    role: "contributor",
  },
]

const mockAttributes: Attribute[] = [
  { id: "1", slug: "breaking-news", name: "Breaking News", category_id: "1", description: "Breaking news stories" },
  { id: "2", slug: "feature", name: "Feature", category_id: "1", description: "In-depth features" },
  { id: "3", slug: "analysis", name: "Analysis", category_id: "2", description: "Market analysis" },
  { id: "4", slug: "trends", name: "Trends", category_id: "2", description: "Trending topics" },
]

const mockCategories: Category[] = [
  { id: "1", slug: "technology", name: "Technology", description: "Latest tech news and trends", post_count: 25 },
  { id: "2", slug: "business", name: "Business", description: "Business insights and market analysis", post_count: 18 },
  { id: "3", slug: "science", name: "Science", description: "Scientific discoveries and research", post_count: 12 },
  { id: "4", slug: "culture", name: "Culture", description: "Arts, entertainment, and lifestyle", post_count: 15 },
]

const mockTags: Tag[] = [
  { id: "1", slug: "ai", name: "AI" },
  { id: "2", slug: "web-development", name: "Web Development" },
  { id: "3", slug: "startup", name: "Startup" },
  { id: "4", slug: "cryptocurrency", name: "Cryptocurrency" },
]

const mockPosts: Post[] = [
  {
    id: "1",
    slug: "future-of-ai-technology",
    title: "The Future of AI Technology in 2025",
    excerpt: "Exploring the latest developments in artificial intelligence and how they will shape our future.",
    body_html:
      "<p>Artificial intelligence continues to evolve at an unprecedented pace. Recent breakthroughs in large language models and computer vision are transforming industries worldwide.</p><p>Experts predict that AI will become increasingly integrated into our daily lives, from healthcare to transportation. The key challenges remain ensuring ethical development and addressing concerns about job displacement.</p><p>Companies are investing billions in AI research, with a focus on making these systems more accessible and beneficial for society as a whole.</p>",
    featured_image: "/futuristic-ai-technology.png",
    author: mockAuthors[0],
    category: mockCategories[0],
    tags: [mockTags[0], mockTags[1]],
    status: "published",
    published_at: "2025-01-05T10:00:00Z",
    created_at: "2025-01-04T15:00:00Z",
    updated_at: "2025-01-05T10:00:00Z",
    read_time: 5,
    views: 1234,
    is_featured: true,
  },
  {
    id: "2",
    slug: "startup-ecosystem-growth",
    title: "Startup Ecosystem Shows Strong Growth",
    excerpt: "New data reveals significant expansion in the global startup landscape.",
    body_html:
      "<p>The startup ecosystem is experiencing remarkable growth across multiple sectors. Venture capital investments have reached new highs, with particular interest in climate tech and healthcare innovations.</p><p>Emerging markets are becoming increasingly attractive to investors, with Southeast Asia and Latin America leading the way in new company formations.</p>",
    featured_image: "/startup-office-team.jpg",
    author: mockAuthors[1],
    category: mockCategories[1],
    tags: [mockTags[2]],
    status: "published",
    published_at: "2025-01-06T14:30:00Z",
    created_at: "2025-01-06T10:00:00Z",
    updated_at: "2025-01-06T14:30:00Z",
    read_time: 4,
    views: 856,
    is_featured: true,
  },
  {
    id: "3",
    slug: "cryptocurrency-market-update",
    title: "Cryptocurrency Market Sees Renewed Interest",
    excerpt: "Analysis of recent trends in the digital currency space.",
    body_html:
      "<p>The cryptocurrency market is showing signs of renewed investor interest after a period of consolidation. Bitcoin and Ethereum have maintained steady growth, while new blockchain projects are attracting attention.</p><p>Regulatory clarity in major markets is helping to boost confidence among institutional investors.</p>",
    featured_image: "/cryptocurrency-blockchain.png",
    author: mockAuthors[1],
    category: mockCategories[1],
    tags: [mockTags[3]],
    status: "published",
    published_at: "2025-01-07T09:00:00Z",
    created_at: "2025-01-07T08:00:00Z",
    updated_at: "2025-01-07T09:00:00Z",
    read_time: 6,
    views: 2103,
    is_featured: false,
  },
  {
    id: "4",
    slug: "web-development-trends-2025",
    title: "Top Web Development Trends for 2025",
    excerpt: "What developers need to know about the latest frameworks and tools.",
    body_html:
      "<p>Web development continues to evolve with new frameworks and tools emerging constantly. React Server Components and the App Router in Next.js are changing how we build web applications.</p><p>Performance optimization remains a top priority, with Core Web Vitals becoming increasingly important for SEO.</p>",
    featured_image: "/web-development-code.png",
    author: mockAuthors[0],
    category: mockCategories[0],
    tags: [mockTags[1]],
    status: "published",
    published_at: "2025-01-06T16:00:00Z",
    created_at: "2025-01-06T12:00:00Z",
    updated_at: "2025-01-06T16:00:00Z",
    read_time: 7,
    views: 1567,
    is_featured: false,
  },
]

const mockDashboardStats: DashboardStats = {
  total_posts: 42,
  published_posts: 35,
  draft_posts: 5,
  scheduled_posts: 2,
  total_views: 12345,
  total_users: 8,
}

export const mockApi = {
  // Public API
  async getPosts(params?: {
    published?: boolean
    limit?: number
    cursor?: string
    categorySlug?: string
    search?: string
    tags?: string[]
    dateFrom?: string
    dateTo?: string
    sortBy?: "date" | "views" | "title"
  }): Promise<ApiResponse<Post[]>> {
    await delay(300)
    let posts = [...mockPosts]

    if (params?.published) {
      posts = posts.filter((p) => p.status === "published")
    }

    if (params?.categorySlug) {
      posts = posts.filter((p) => p.category.slug === params.categorySlug)
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.excerpt.toLowerCase().includes(searchLower) ||
          p.body_html.toLowerCase().includes(searchLower),
      )
    }

    if (params?.tags && params.tags.length > 0) {
      posts = posts.filter((p) => params.tags!.some((tag) => p.tags.some((t) => t.slug === tag)))
    }

    if (params?.dateFrom) {
      posts = posts.filter((p) => p.published_at && p.published_at >= params.dateFrom!)
    }
    if (params?.dateTo) {
      posts = posts.filter((p) => p.published_at && p.published_at <= params.dateTo!)
    }

    if (params?.sortBy) {
      posts.sort((a, b) => {
        switch (params.sortBy) {
          case "date":
            return (
              new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
            )
          case "views":
            return b.views - a.views
          case "title":
            return a.title.localeCompare(b.title)
          default:
            return 0
        }
      })
    } else {
      // Default sort by date
      posts.sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime(),
      )
    }

    const limit = params?.limit || 20
    return {
      data: posts.slice(0, limit),
    }
  },

  async getPost(slug: string): Promise<Post | null> {
    await delay(200)
    return mockPosts.find((p) => p.slug === slug) || null
  },

  async getCategories(): Promise<Category[]> {
    await delay(100)
    return mockCategories
  },

  async getTags(): Promise<Tag[]> {
    await delay(100)
    return mockTags
  },

  async getAuthor(slug: string): Promise<Author | null> {
    await delay(200)
    return mockAuthors.find((a) => a.slug === slug) || null
  },

  // Admin API
  async login(email: string, password: string): Promise<LoginResponse> {
    await delay(500)
    if (email === "admin@example.com" && password === "password") {
      return {
        token: "mock-jwt-token-" + Date.now(),
        user: mockAuthors[0],
      }
    }
    throw new Error("Invalid credentials")
  },

  async getDashboardStats(): Promise<DashboardStats> {
    await delay(300)
    return mockDashboardStats
  },

  async getAdminPosts(status?: string): Promise<Post[]> {
    await delay(300)
    if (status && status !== "all") {
      return mockPosts.filter((p) => p.status === status)
    }
    return mockPosts
  },

  async createPost(post: Partial<Post>): Promise<Post> {
    await delay(500)
    const newPost: Post = {
      id: String(Date.now()),
      slug: post.slug || "",
      title: post.title || "",
      excerpt: post.excerpt || "",
      body_html: post.body_html || "",
      featured_image: post.featured_image,
      author: mockAuthors[0],
      category: post.category || mockCategories[0],
      tags: post.tags || [],
      status: post.status || "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_time: 5,
      views: 0,
      is_featured: post.is_featured || false,
    }
    mockPosts.unshift(newPost)
    return newPost
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    await delay(500)
    const index = mockPosts.findIndex((p) => p.id === id)
    if (index === -1) throw new Error("Post not found")

    mockPosts[index] = { ...mockPosts[index], ...updates, updated_at: new Date().toISOString() }
    return mockPosts[index]
  },

  async deletePost(id: string): Promise<void> {
    await delay(300)
    const index = mockPosts.findIndex((p) => p.id === id)
    if (index > -1) {
      mockPosts.splice(index, 1)
    }
  },

  async uploadMedia(file: File): Promise<MediaFile> {
    await delay(1000)
    return {
      id: String(Date.now()),
      url: URL.createObjectURL(file),
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      created_at: new Date().toISOString(),
    }
  },

  async getUsers(): Promise<Author[]> {
    await delay(300)
    return mockAuthors
  },

  async getAdminCategories(): Promise<Category[]> {
    await delay(100)
    return mockCategories.map((cat) => ({
      ...cat,
      attributes: mockAttributes.filter((attr) => attr.category_id === cat.id),
    }))
  },

  async createCategory(category: { name: string; slug: string; description?: string }): Promise<Category> {
    await delay(300)
    const newCategory: Category = {
      id: String(Date.now()),
      ...category,
      attributes: [],
      post_count: 0,
    }
    mockCategories.push(newCategory)
    return newCategory
  },

  async updateCategory(id: string, updates: { name?: string; slug?: string; description?: string }): Promise<Category> {
    await delay(300)
    const index = mockCategories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error("Category not found")
    mockCategories[index] = { ...mockCategories[index], ...updates }
    return {
      ...mockCategories[index],
      attributes: mockAttributes.filter((attr) => attr.category_id === id),
    }
  },

  async deleteCategory(id: string): Promise<void> {
    await delay(300)
    const index = mockCategories.findIndex((c) => c.id === id)
    if (index > -1) {
      mockCategories.splice(index, 1)
    }
  },

  async getAdminAttributes(categoryId?: string): Promise<Attribute[]> {
    await delay(100)
    if (categoryId) {
      return mockAttributes.filter((attr) => attr.category_id === categoryId)
    }
    return mockAttributes
  },

  async createAttribute(attribute: {
    name: string
    slug: string
    description?: string
    category_id: string
  }): Promise<Attribute> {
    await delay(300)
    const newAttribute: Attribute = {
      id: String(Date.now()),
      ...attribute,
    }
    mockAttributes.push(newAttribute)
    return newAttribute
  },

  async updateAttribute(
    id: string,
    updates: { name?: string; slug?: string; description?: string },
  ): Promise<Attribute> {
    await delay(300)
    const index = mockAttributes.findIndex((a) => a.id === id)
    if (index === -1) throw new Error("Attribute not found")
    mockAttributes[index] = { ...mockAttributes[index], ...updates }
    return mockAttributes[index]
  },

  async deleteAttribute(id: string): Promise<void> {
    await delay(300)
    const index = mockAttributes.findIndex((a) => a.id === id)
    if (index > -1) {
      mockAttributes.splice(index, 1)
    }
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
