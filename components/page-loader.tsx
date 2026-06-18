export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <span className="animate-spin-football text-5xl select-none" role="status" aria-label="Loading">
        ⚽
      </span>
    </div>
  )
}
