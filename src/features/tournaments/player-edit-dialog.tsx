"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePlayerAction } from "@/features/tournaments/actions";
import { ImageUploadOrUrlField } from "@/features/uploads/image-upload-or-url-field";

export interface PlayerEditSnapshot {
  id: string;
  name: string;
  category: "MEN_BEGINNER" | "MEN_INTERMEDIATE" | "MEN_ADVANCED" | "WOMEN";
  gender: "MALE" | "FEMALE" | "OTHER";
  photoUrl: string | null;
  notes: string | null;
}

interface PlayerEditDialogProps {
  tournamentSlug: string;
  player: PlayerEditSnapshot;
  uploadsEnabled: boolean;
}

export function PlayerEditDialog({
  tournamentSlug,
  player,
  uploadsEnabled,
}: PlayerEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(player.name);
  const [category, setCategory] = useState(player.category);
  const [gender, setGender] = useState(player.gender);
  const [photoUrl, setPhotoUrl] = useState(player.photoUrl ?? "");
  const [notes, setNotes] = useState(player.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDialog(): void {
    setName(player.name);
    setCategory(player.category);
    setGender(player.gender);
    setPhotoUrl(player.photoUrl ?? "");
    setNotes(player.notes ?? "");
    setError(null);
    setOpen(true);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await updatePlayerAction({
        tournamentSlug,
        playerId: player.id,
        name: name.trim(),
        photoUrl: photoUrl.trim() || undefined,
        category,
        gender,
        notes: notes.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" type="button" onClick={openDialog}>
        Edit
      </Button>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit player</DialogTitle>
          <DialogDescription>
            Update name, group, gender, notes, and photo. Changing group refreshes pick-limit math on
            the rules page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[min(70vh,560px)] gap-3 overflow-y-auto py-1 pr-1">
          <div className="space-y-2">
            <Label htmlFor={`player-name-${player.id}`}>Athlete name</Label>
            <Input
              id={`player-name-${player.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={1}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`player-category-${player.id}`}>Category</Label>
            <select
              id={`player-category-${player.id}`}
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as PlayerEditSnapshot["category"],
                )
              }
              className={selectClass}
            >
              <option value="MEN_BEGINNER">Men · Beginner</option>
              <option value="MEN_INTERMEDIATE">Men · Intermediate</option>
              <option value="MEN_ADVANCED">Men · Advanced</option>
              <option value="WOMEN">Women</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`player-gender-${player.id}`}>Gender marker</Label>
            <select
              id={`player-gender-${player.id}`}
              value={gender}
              onChange={(event) =>
                setGender(event.target.value as PlayerEditSnapshot["gender"])
              }
              className={selectClass}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <ImageUploadOrUrlField
            tournamentSlug={tournamentSlug}
            purpose="player-photo"
            label="Photo"
            urlInputId={`player-photo-${player.id}`}
            urlValue={photoUrl}
            onUrlChange={setPhotoUrl}
            uploadsEnabled={uploadsEnabled}
          />
          <div className="space-y-2">
            <Label htmlFor={`player-notes-${player.id}`}>Notes</Label>
            <Textarea
              id={`player-notes-${player.id}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Playing style, doubles preference…"
            />
          </div>
        </div>
        {error ? (
          <p className="whitespace-pre-wrap text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
          <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
            Cancel
          </DialogClose>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
