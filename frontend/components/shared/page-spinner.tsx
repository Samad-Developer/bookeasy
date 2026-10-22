export function PageSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-1 items-center justify-center py-16">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}