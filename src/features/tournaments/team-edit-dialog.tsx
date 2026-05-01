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
import { updateTeamAction } from "@/features/tournaments/actions";
import { ImageUploadOrUrlField } from "@/features/uploads/image-upload-or-url-field";
import {
  OwnerPicker,
  type AssignablePerson,
} from "@/features/tournaments/owner-picker";

export interface TeamEditSnapshot {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  colorHex: string | null;
  ownerUserId: string | null;
}

interface TeamEditDialogProps {
  tournamentSlug: string;
  team: TeamEditSnapshot;
  assignablePeople: AssignablePerson[];
  uploadsEnabled: boolean;
}

export function TeamEditDialog({
  tournamentSlug,
  team,
  assignablePeople,
  uploadsEnabled,
}: TeamEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName ?? "");
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? "");
  const [colorHex, setColorHex] = useState(team.colorHex ?? "");
  const [ownerUserId, setOwnerUserId] = useState(team.ownerUserId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDialog(): void {
    setName(team.name);
    setShortName(team.shortName ?? "");
    setLogoUrl(team.logoUrl ?? "");
    setColorHex(team.colorHex ?? "");
    setOwnerUserId(team.ownerUserId ?? "");
    setError(null);
    setOpen(true);
  }

  async function handleSave(): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await updateTeamAction({
        tournamentSlug,
        teamId: team.id,
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        colorHex: colorHex.trim() || undefined,
        ownerUserId,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" type="button" onClick={openDialog}>
        Edit
      </Button>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit franchise</DialogTitle>
          <DialogDescription>
            Name, ticker, broadcast extras, and who owns this franchise on draft day.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[min(70vh,520px)] gap-3 overflow-y-auto py-1 pr-1">
          <div className="space-y-2">
            <Label htmlFor={`team-name-${team.id}`}>Franchise name</Label>
            <Input
              id={`team-name-${team.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`team-short-${team.id}`}>Ticker</Label>
            <Input
              id={`team-short-${team.id}`}
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              maxLength={8}
              placeholder="CCR"
            />
          </div>
          <OwnerPicker
            id={`team-owner-${team.id}`}
            label="Franchise owner"
            value={ownerUserId}
            onChange={setOwnerUserId}
            people={assignablePeople}
          />
          <ImageUploadOrUrlField
            tournamentSlug={tournamentSlug}
            purpose="team-logo"
            label="Franchise logo"
            urlInputId={`team-logo-${team.id}`}
            urlValue={logoUrl}
            onUrlChange={setLogoUrl}
            uploadsEnabled={uploadsEnabled}
          />
          <div className="space-y-2">
            <Label htmlFor={`team-color-${team.id}`}>Accent HEX</Label>
            <Input
              id={`team-color-${team.id}`}
              value={colorHex}
              onChange={(event) => setColorHex(event.target.value)}
              placeholder="#38bdf8"
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
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
