"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlayerAction } from "@/features/tournaments/actions";
import { ImageUploadOrUrlField } from "@/features/uploads/image-upload-or-url-field";
import { cn } from "@/lib/utils";

export interface RosterCategorySelectOption {
  id: string;
  name: string;
}

interface PlayersQuickAddProps {
  tournamentSlug: string;
  uploadsEnabled: boolean;
  selectableCategories: RosterCategorySelectOption[];
  defaultRosterCategoryId: string;
  /** Default `card` embeds bordered panel used on legacy pages; `plain` strips chrome for drawers. */
  variant?: "card" | "plain";
  onCreated?: () => void;
}

export function PlayersQuickAdd({
  tournamentSlug,
  uploadsEnabled,
  selectableCategories,
  defaultRosterCategoryId,
  variant = "card",
  onCreated,
}: PlayersQuickAddProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [rosterCategoryId, setRosterCategoryId] = useState(defaultRosterCategoryId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const gender = String(formData.get("gender") ?? "");
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createPlayerAction({
        tournamentSlug,
        name: String(formData.get("name") ?? ""),
        photoUrl: photoUrl.trim() || undefined,
        rosterCategoryId,
        gender: gender as "MALE" | "FEMALE" | "OTHER",
        notes: String(formData.get("notes") ?? "").trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setPhotoUrl("");
      setRosterCategoryId(defaultRosterCategoryId);
      router.refresh();
      onCreated?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={cn(
        "grid gap-4 lg:grid-cols-2",
        variant === "card" &&
          "rounded-xl border border-border/70 bg-card/40 p-6 backdrop-blur-md",
      )}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="player-name">Athlete name</Label>
        <Input id="player-name" name="name" required placeholder="Alex Morgan" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roster-category">Roster group</Label>
        <select
          id="roster-category"
          name="rosterCategoryId"
          value={rosterCategoryId}
          onChange={(event) => setRosterCategoryId(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {selectableCategories.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Gender marker</Label>
        <select
          id="gender"
          name="gender"
          defaultValue="MALE"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="lg:col-span-2">
        <ImageUploadOrUrlField
          tournamentSlug={tournamentSlug}
          purpose="player-photo"
          label="Photo"
          urlInputId="photoUrl"
          urlValue={photoUrl}
          onUrlChange={setPhotoUrl}
          uploadsEnabled={uploadsEnabled}
        />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="player-notes">Notes</Label>
        <Textarea
          id="player-notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Playing style, doubles preference…"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <div className="lg:col-span-2">
        <Button type="submit" pending={isSubmitting} pendingLabel="Adding…" className="min-h-11">
          Add player
        </Button>
      </div>
    </form>
  );
}
