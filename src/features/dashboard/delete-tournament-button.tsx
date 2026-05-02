"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteTournamentAction } from "@/features/tournaments/actions";
import { cn } from "@/lib/utils";

interface DeleteTournamentButtonProps {
  tournamentSlug: string;
  tournamentName: string;
  className?: string;
  iconOnly?: boolean;
}

export function DeleteTournamentButton({
  tournamentSlug,
  tournamentName,
  className,
  iconOnly = false,
}: DeleteTournamentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await deleteTournamentAction({ tournamentSlug });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? "icon-sm" : "default"}
        className={cn(
          iconOnly
            ? "size-8 min-h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "min-h-11 w-full touch-manipulation border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto",
          className,
        )}
        aria-label={iconOnly ? `Delete ${tournamentName}` : undefined}
        title={iconOnly ? `Delete ${tournamentName}` : undefined}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {iconOnly ? <Trash2Icon aria-hidden /> : "Delete tournament"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md" size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tournament?</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <span className="font-medium text-foreground">{tournamentName}</span> will disappear
              from your dashboard. This only works if there are no draft picks on record yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              className="min-h-11 touch-manipulation"
              pending={busy}
              pendingLabel="Deleting…"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
