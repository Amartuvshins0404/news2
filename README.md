# AuroraNews Frontend

A modern, production-ready news platform built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

### Public Site
- Responsive homepage with featured articles
- Individual article pages with sanitized HTML content
- Category-based article filtering
- **Advanced search page** with keyword search, category/tag filters, date range, and sorting
- Dark mode support with system preference detection
- Internationalization (English & Mongolian)
- SEO optimization with JSON-LD schema
- Performance optimized with Next.js ISR

### Admin Panel
- Secure authentication with JWT simulation
- Dashboard with analytics
- Posts management (create, edit, delete, publish, schedule)
- Media library with drag-and-drop upload
- User management with role-based access control
- WYSIWYG-ready HTML editor with preview
- Real-time content sanitization

### Security Features
- Content Security Policy (CSP) headers
- HTML sanitization with DOMPurify
- File upload validation (type & size)
- Safe redirect validation
- Protected admin routes
- XSS prevention
- CSRF-ready architecture

### Search & Discovery
- **Full-text search** across titles, excerpts, and content
- **Advanced filters**: Categories, tags, date ranges
- **Sort options**: By date, views, or title
- **Real-time results** with URL-synced parameters
- **Active filter display** with easy removal
- **Responsive filters panel** with mobile support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Internationalization**: Custom i18n implementation
- **Sanitization**: DOMPurify (isomorphic)
- **State Management**: React Hooks + SWR-ready
- **Authentication**: JWT simulation (backend-ready)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
   - Copy `.env` to your environment
   - Configure `NEXT_PUBLIC_USE_MOCK_API=true` for development
   - Update `NEXT_PUBLIC_API_URL` when connecting to real backend

4. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

### Default Admin Credentials (Mock Mode)

- Email: `admin@example.com`
- Password: `password`

## Project Structure

\`\`\`
├── app/                      # Next.js app directory
│   ├── admin/               # Admin panel pages
│   ├── category/            # Category pages
│   ├── post/                # Article pages
│   ├── search/              # Search & filter page
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── admin/              # Admin-specific components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Public site components
├── lib/                     # Utilities & services
│   ├── i18n/               # Internationalization
│   ├── api-client.ts       # API client
│   ├── mock-api.tsx        # Mock API responses
│   ├── sanitize.ts         # Security utilities
│   └── types.ts            # TypeScript types
└── public/                  # Static assets
\`\`\`

## Using the Search Feature

### Accessing Search
Navigate to `/search` or click the search icon in the main navigation.

### Search Capabilities

**Basic Search:**
- Enter keywords to search across article titles, excerpts, and content
- Press Enter or click the search button to execute

**Filters:**
- **Category**: Filter by specific content category
- **Tags**: Select multiple tags for refined results
- **Date Range**: Set from/to dates for time-based filtering
- **Sort By**: Choose date (newest first), most viewed, or title (A-Z)

**Filter Management:**
- Active filters shown as removable chips
- Click X on any filter chip to remove it
- Use "Clear Filters" to reset all filters at once
- Filters persist in URL for shareable search links

### Search API

\`\`\`typescript
// Example search API call
const { data } = await apiClient.getPosts({
  published: true,
  search: "artificial intelligence",
  categorySlug: "technology",
  tags: ["ai", "web-development"],
  dateFrom: "2025-01-01",
  dateTo: "2025-01-31",
  sortBy: "date",
  limit: 50,
})
\`\`\`

## Switching to Real Backend

1. Update `.env`:
   \`\`\`env
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_URL=https://your-api.com/api/v1
   \`\`\`

2. Implement authentication token refresh in `lib/api-client.ts`
3. Add CSRF token handling for mutations
4. Configure secure cookie settings
5. Update CSP headers in `app/layout.tsx` with your API domain

## API Contract

The API client supports the following search parameters:

**GET /posts**
- `q` - Search query string (searches title, excerpt, body)
- `category` - Category slug filter
- `tags[]` - Array of tag slugs
- `date_from` - ISO date string for start of range
- `date_to` - ISO date string for end of range
- `sort` - Sort order: "date", "views", or "title"
- `limit` - Results per page (default: 20)
- `published` - Filter by published status

See [APICONTRACT.md](./APICONTRACT.md) for complete endpoint specifications.

## Security

See [SECURITY.md](./SECURITY.md) for security guidelines and best practices.

## Performance

- ISR enabled for article pages (60s revalidation)
- Optimized images with Next/Image
- Code splitting with dynamic imports
- Lazy loading for below-the-fold content
- Prefetching for navigation links
- Client-side search result caching

## Internationalization

To add a new language:

1. Create `lib/i18n/locales/[lang]/common.json`
2. Create `lib/i18n/locales/[lang]/admin.json`
3. Add language to `lib/i18n/config.ts`
4. Include search translations in common.json

Current translations include dedicated search namespace with:
- Search UI labels (title, placeholder, filters)
- Sort options (date, views, title)
- Result states (loading, empty, count)
- Filter labels (category, tags, date range)

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## License

MIT
