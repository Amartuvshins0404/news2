import sanitize from "sanitize-html"

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "class"],
      img: ["src", "alt", "title", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowVulnerableTags: false,
  })
}

export function validateRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin
  } catch {
    return false
  }
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  const maxSize = 15 * 1024 * 1024 // 15MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 15MB limit." }
  }

  return { valid: true }
}
