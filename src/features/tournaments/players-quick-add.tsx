"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlayerAction } from "@/features/tournaments/actions";
import { ImageUploadOrUrlField } from "@/features/uploads/image-upload-or-url-field";

interface PlayersQuickAddProps {
  tournamentSlug: string;
  uploadsEnabled: boolean;
}

export function PlayersQuickAdd({ tournamentSlug, uploadsEnabled }: PlayersQuickAddProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const category = String(formData.get("category") ?? "");
    const gender = String(formData.get("gender") ?? "");
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createPlayerAction({
        tournamentSlug,
        name: String(formData.get("name") ?? ""),
        photoUrl: photoUrl.trim() || undefined,
        category: category as "MEN_BEGINNER" | "MEN_INTERMEDIATE" | "MEN_ADVANCED" | "WOMEN",
        gender: gender as "MALE" | "FEMALE" | "OTHER",
        notes: String(formData.get("notes") ?? "").trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setPhotoUrl("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-border/70 bg-card/40 p-6 backdrop-blur-md lg:grid-cols-2"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="player-name">Athlete name</Label>
        <Input id="player-name" name="name" required placeholder="Alex Morgan" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue="MEN_INTERMEDIATE"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="MEN_BEGINNER">Men · Beginner</option>
          <option value="MEN_INTERMEDIATE">Men · Intermediate</option>
          <option value="MEN_ADVANCED">Men · Advanced</option>
          <option value="WOMEN">Women</option>
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
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Playing style, injuries, doubles preference…"
        />
      </div>
      <div className="flex items-end lg:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add athlete"}
        </Button>
      </div>
      {error ? (
        <p className="lg:col-span-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
