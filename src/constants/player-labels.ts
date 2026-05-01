import type { Gender, PlayerCategory } from "@/generated/prisma/enums";

export const PLAYER_CATEGORY_LABEL: Record<PlayerCategory, string> = {
  MEN_BEGINNER: "Men · Beginner",
  MEN_INTERMEDIATE: "Men · Intermediate",
  MEN_ADVANCED: "Men · Advanced",
  WOMEN: "Women",
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};
