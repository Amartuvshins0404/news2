import type { Metadata } from "next"

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: "website" | "article"
  publishedTime?: string
  author?: string
}

export function generateSEOMetadata({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  author,
}: SEOProps): Metadata {
  const siteName = "AuroraNews"
  const fullTitle = `${title} | ${siteName}`
  const fullUrl = url || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const ogImage = image || "/placeholder.svg?height=630&width=1200"

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName,
      images: [{ url: ogImage }],
      type,
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    ...(author && { authors: [{ name: author }] }),
  }
}

interface ArticleSchemaProps {
  title: string
  description: string
  image?: string
  author: string
  publishedTime: string
  url: string
}

export function generateArticleSchema({ title, description, image, author, publishedTime, url }: ArticleSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image || "/placeholder.svg?height=630&width=1200",
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "AuroraNews",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/icon.svg`,
      },
    },
    datePublished: publishedTime,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }
}
