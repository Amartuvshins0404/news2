import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"

export default function PublicLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="h-12 bg-muted rounded w-64 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-video bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
