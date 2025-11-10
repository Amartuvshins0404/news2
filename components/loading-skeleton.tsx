import { Card, CardContent } from "@/components/ui/card"

export function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse"></div>
      <CardContent className="p-5 space-y-3">
        <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-full animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ArticlePageSkeleton() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
        <div className="h-12 bg-muted rounded w-full animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-full animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-4/5 animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="aspect-video bg-muted rounded-lg animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-full animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
