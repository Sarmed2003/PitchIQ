import { create } from "zustand";

type LeagueState = {
  activeLeagueId: string | null;
  setActiveLeagueId: (id: string | null) => void;
};

export const useLeagueStore = create<LeagueState>((set) => ({
  activeLeagueId: null,
  setActiveLeagueId: (activeLeagueId) => set({ activeLeagueId }),
}));
