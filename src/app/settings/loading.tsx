import { Skeleton } from "@/components/ui/skeleton";

/** Settings shell placeholder while commissioner preferences stream. */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap justify-between gap-4 pb-8">
        <Skeleton className="h-10 w-32 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="h-11 w-[7rem] rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-11 w-[min(16rem_100%)]" />
      <Skeleton className="mt-4 h-24 w-full max-w-xl rounded-xl" />
      <Skeleton className="mt-10 h-[22rem] w-full rounded-xl" />
    </div>
  );
}
