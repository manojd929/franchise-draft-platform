import { Skeleton } from "@/components/ui/skeleton";

/** Route-level placeholders while commissioner dashboard streams. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-11">
      <header className="flex flex-col gap-6 border-b border-border/40 pb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-8">
        <div className="max-w-xl space-y-4">
          <Skeleton className="h-10 w-[min(20rem_100%)]" />
          <Skeleton className="h-14 w-full max-w-md rounded-lg sm:h-12" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Skeleton className="h-11 min-h-11 w-full rounded-lg sm:w-28" />
          <Skeleton className="h-11 min-h-11 w-full rounded-lg sm:w-[10.5rem]" />
        </div>
      </header>
      <section className="grid gap-5 md:grid-cols-2 md:gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`dashboard-card-skeleton-${String(index)}`}
            className="h-56 rounded-xl md:h-64"
          />
        ))}
      </section>
    </div>
  );
}
