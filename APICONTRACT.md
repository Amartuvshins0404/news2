# API Contract Documentation

This document describes the API endpoints that the frontend expects from the backend.

## Base URL

\`\`\`
Production: https://api.yourdomain.com/api/v1
Development: http://localhost:3000/api/v1
\`\`\`

## Authentication

All admin endpoints require authentication via JWT token:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Public Endpoints

### GET /posts

Get list of published posts

**Query Parameters:**
- \`published\` (boolean): Filter by published status
- \`limit\` (number): Number of posts to return (default: 20)
- \`cursor\` (string): Pagination cursor
- \`category\` (string): Filter by category slug

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "string",
      "slug": "string",
      "title": "string",
      "excerpt": "string",
      "body_html": "string",
      "featured_image": "string",
      "author": {
        "id": "string",
        "slug": "string",
        "name": "string",
        "bio": "string",
        "avatar": "string",
        "role": "admin | editor | contributor"
      },
      "category": {
        "id": "string",
        "slug": "string",
        "name": "string",
        "description": "string",
        "post_count": number
      },
      "tags": [
        {
          "id": "string",
          "slug": "string",
          "name": "string"
        }
      ],
      "status": "published",
      "published_at": "ISO8601 date",
      "created_at": "ISO8601 date",
      "updated_at": "ISO8601 date",
      "read_time": number,
      "views": number,
      "is_featured": boolean
    }
  ],
  "nextCursor": "string"
}
\`\`\`

### GET /posts/:slug

Get single post by slug

**Response:** Single Post object (same structure as above)

### GET /categories

Get all categories

**Response:**
\`\`\`json
[
  {
    "id": "string",
    "slug": "string",
    "name": "string",
    "description": "string",
    "post_count": number
  }
]
\`\`\`

### GET /tags

Get all tags

**Response:**
\`\`\`json
[
  {
    "id": "string",
    "slug": "string",
    "name": "string"
  }
]
\`\`\`

### GET /authors/:slug

Get author by slug

**Response:** Author object

## Admin Endpoints

### POST /admin/login

Authenticate user

**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "admin | editor | contributor"
  }
}
\`\`\`

### GET /admin/dashboard

Get dashboard statistics

**Response:**
\`\`\`json
{
  "total_posts": number,
  "published_posts": number,
  "draft_posts": number,
  "scheduled_posts": number,
  "total_views": number,
  "total_users": number
}
\`\`\`

### GET /admin/posts

Get all posts (including drafts)

**Query Parameters:**
- \`status\` (string): Filter by status (draft, scheduled, published)

**Response:** Array of Post objects

### POST /admin/posts

Create new post

**Request Body:**
\`\`\`json
{
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "body_html": "string",
  "featured_image": "string",
  "category_id": "string",
  "tag_ids": ["string"],
  "status": "draft | scheduled | published",
  "is_featured": boolean,
  "scheduled_at": "ISO8601 date (optional)"
}
\`\`\`

**Response:** Created Post object

### PUT /admin/posts/:id

Update existing post

**Request Body:** Same as POST /admin/posts

**Response:** Updated Post object

### DELETE /admin/posts/:id

Delete post

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

### POST /admin/media

Upload media file

**Request:** multipart/form-data with file field

**Response:**
\`\`\`json
{
  "id": "string",
  "url": "string",
  "filename": "string",
  "mimetype": "string",
  "size": number,
  "created_at": "ISO8601 date"
}
\`\`\`

### GET /admin/users

Get all users

**Response:** Array of Author objects

## Error Responses

All endpoints may return error responses:

\`\`\`json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
\`\`\`

**Common HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Rate Limiting

Recommended rate limits:
- Public endpoints: 60 requests per minute per IP
- Admin endpoints: 30 requests per minute per user

Rate limit headers:
\`\`\`
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
\`\`\`

## Security Headers Required

All responses should include:
\`\`\`
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
\`\`\`
