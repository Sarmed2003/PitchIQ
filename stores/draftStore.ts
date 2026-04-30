import { create } from "zustand";

type DraftState = {
  highlightedPlayerId: number | null;
  setHighlightedPlayerId: (id: number | null) => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  highlightedPlayerId: null,
  setHighlightedPlayerId: (highlightedPlayerId) => set({ highlightedPlayerId }),
}));
