export function HomePageSkeleton() {
  return (
    <div className="flex-1 animate-pulse">
      <section className="bg-muted/30 border-b border-border/50">
        <div className="container max-w-5xl py-16 space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="aspect-video bg-muted rounded" />
            <div className="aspect-video bg-muted rounded hidden md:block" />
            <div className="aspect-video bg-muted rounded hidden md:block" />
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-12 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-6 w-16 bg-muted rounded hidden md:block" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="space-y-3">
              <div className="aspect-[4/3] bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <div className="flex-1 animate-pulse">
      <section className="container py-12 space-y-6 max-w-5xl">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted rounded" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <article key={index} className="space-y-3">
              <div className="aspect-[4/3] bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PostPageSkeleton() {
  return (
    <div className="flex-1 animate-pulse">
      <section className="relative bg-muted/20">
        <div className="container max-w-5xl py-16 space-y-8">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="aspect-[16/9] bg-muted rounded" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded hidden md:block" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-3 w-full bg-muted rounded" />
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-12 space-y-6">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </section>
    </div>
  );
}
