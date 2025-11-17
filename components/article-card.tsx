import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/types"
import { Clock, Eye, Menu } from "lucide-react"

interface ArticleCardProps {
  post: Post
  featured?: boolean
}

export function ArticleCard({ post, featured = false }: ArticleCardProps) {
  const date = new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Link href={`/post/${post.slug}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full border-border/50 hover:border-primary/30 bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={post.featured_image || "/placeholder.svg?height=320&width=400"}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Logo overlay in top left */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Image
              src="/logo.png"
              alt="yo."
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          {/* Menu icon in top right */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-8 w-8 rounded bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Menu className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <CardContent className="p-5 space-y-3 bg-card">
          <Badge variant="secondary" className="text-xs">
            {post.category.name}
          </Badge>
          <h3 className="text-lg font-bold line-clamp-2 text-balance leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 text-pretty leading-relaxed">{post.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              {post.author.avatar && (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="font-medium">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.read_time}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{post.views}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
