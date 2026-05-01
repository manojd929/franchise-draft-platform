"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AssignablePerson {
  id: string;
  email: string;
  displayName: string | null;
}

const NONE_VALUE = "__none__";

interface OwnerPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (userId: string) => void;
  people: AssignablePerson[];
  className?: string;
}

export function OwnerPicker({
  id,
  label,
  value,
  onChange,
  people,
  className,
}: OwnerPickerProps) {
  const trimmed = value.trim();
  const selectValue = trimmed === "" ? NONE_VALUE : trimmed;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next == null || next === NONE_VALUE) {
            onChange("");
            return;
          }
          onChange(next);
        }}
      >
        <SelectTrigger id={id} className="w-full min-w-0 max-w-full">
          <SelectValue placeholder="Choose someone…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>No owner yet</SelectItem>
          {people.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.displayName
                ? `${person.displayName} (${person.email})`
                : person.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
