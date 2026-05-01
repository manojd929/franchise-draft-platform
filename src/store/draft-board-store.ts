"use client";

import { create } from "zustand";

import type { Gender, PlayerCategory } from "@/generated/prisma/enums";

export type SortMode = "name_asc" | "category" | "availability";

interface DraftBoardUiState {
  search: string;
  categoryFilter: PlayerCategory | "ALL";
  genderFilter: Gender | "ALL";
  sortMode: SortMode;
  setSearch: (value: string) => void;
  setCategoryFilter: (value: PlayerCategory | "ALL") => void;
  setGenderFilter: (value: Gender | "ALL") => void;
  setSortMode: (value: SortMode) => void;
}

export const useDraftBoardUiStore = create<DraftBoardUiState>((set) => ({
  search: "",
  categoryFilter: "ALL",
  genderFilter: "ALL",
  sortMode: "availability",
  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setGenderFilter: (genderFilter) => set({ genderFilter }),
  setSortMode: (sortMode) => set({ sortMode }),
}));
