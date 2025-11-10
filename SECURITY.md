# Security Guidelines

## Frontend Security Responsibilities

### 1. Content Sanitization

**HTML Content**
- All user-generated HTML is sanitized using DOMPurify before rendering
- Sanitization is applied in \`lib/sanitize.ts\`
- Only safe HTML tags and attributes are allowed
- Use \`sanitizeHtml()\` function before any \`dangerouslySetInnerHTML\`

**Implementation:**
\`\`\`typescript
import { sanitizeHtml } from '@/lib/sanitize'

const safeHtml = sanitizeHtml(userGeneratedHtml)
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
\`\`\`

### 2. Content Security Policy (CSP)

**Current CSP Configuration:**
\`\`\`
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live
img-src 'self' data: https: blob:
style-src 'self' 'unsafe-inline'
connect-src 'self' https://vercel.live https://vitals.vercel-insights.com
font-src 'self' data:
\`\`\`

**Required Updates for Production:**
1. Remove \`'unsafe-inline'\` and \`'unsafe-eval'\` from script-src
2. Add your API domain to connect-src
3. Add your CDN domain to img-src if using external CDN
4. Implement nonce-based CSP for inline scripts

### 3. File Upload Security

**Client-Side Validation:**
- File type validation: Only JPEG, PNG, WebP allowed
- File size validation: Maximum 15MB
- Validation implemented in \`lib/sanitize.ts\`

**Backend Requirements:**
- Re-validate file type and size on server
- Scan files for malware
- Store files with generated names (not user-provided)
- Serve files from separate domain/CDN
- Implement virus scanning

### 4. Authentication & Authorization

**Current Implementation:**
- JWT tokens stored in localStorage
- Token sent in Authorization header
- Protected routes in \`app/admin/layout.tsx\`

**Backend Requirements:**
- Implement secure token generation (JWT with short expiry)
- Use httpOnly cookies for tokens (not localStorage)
- Implement refresh token rotation
- Add rate limiting for login attempts
- Implement CSRF protection

**Required Updates:**
\`\`\`typescript
// Switch from localStorage to httpOnly cookies
// Update lib/api-client.ts to handle refresh tokens
// Add CSRF token to mutation requests
\`\`\`

### 5. XSS Prevention

**Measures in Place:**
- HTML sanitization for all user content
- CSP headers to prevent inline script execution
- No eval() or Function() constructors used
- React's automatic escaping for JSX

**Additional Recommendations:**
- Validate all URL parameters
- Sanitize query strings before use
- Use \`rel="noopener noreferrer"\` for external links

### 6. Redirect Validation

**Implementation:**
\`\`\`typescript
import { validateRedirectUrl } from '@/lib/sanitize'

// Only redirect to same-origin URLs
if (validateRedirectUrl(redirectUrl)) {
  router.push(redirectUrl)
}
\`\`\`

### 7. API Security

**Client-Side:**
- All API calls go through \`lib/api-client.ts\`
- Automatic token injection
- Error handling

**Backend Requirements:**
- Implement rate limiting per IP/user
- Add request signing for sensitive operations
- Validate all input data
- Use parameterized queries (prevent SQL injection)
- Implement CORS properly
- Add request/response logging

### 8. CSRF Protection

**Current State:**
- Architecture ready for CSRF tokens
- Comments indicate where to add CSRF headers

**Backend Requirements:**
- Generate CSRF token on login
- Validate CSRF token on all mutations
- Use SameSite cookie attribute

**Implementation:**
\`\`\`typescript
// Add to lib/api-client.ts
const csrfToken = getCsrfToken()
headers['X-CSRF-Token'] = csrfToken
\`\`\`

## Security Checklist for Production

### Before Deployment:

- [ ] Update CSP headers to remove unsafe directives
- [ ] Implement httpOnly cookies for authentication
- [ ] Add CSRF protection
- [ ] Enable rate limiting on backend
- [ ] Set up file scanning for uploads
- [ ] Configure secure cookie flags (Secure, SameSite)
- [ ] Enable HTTPS only
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Implement proper error handling (no sensitive info in errors)
- [ ] Add logging and monitoring
- [ ] Perform security audit
- [ ] Set up WAF (Web Application Firewall)

### Environment Variables:

- [ ] Use separate environments (dev, staging, prod)
- [ ] Never commit secrets to git
- [ ] Rotate API keys regularly
- [ ] Use strong passwords for admin accounts
- [ ] Implement MFA for admin access

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com. Do not create public GitHub issues for security vulnerabilities.

## Regular Security Tasks

- Update dependencies monthly
- Review security advisories weekly
- Rotate credentials quarterly
- Audit access logs weekly
- Review and update CSP headers monthly
- Perform penetration testing quarterly
\`\`\`
