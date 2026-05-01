import { slugify } from "@/utils/slug";

export function tournamentSlugFromName(name: string): string {
  const base = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
