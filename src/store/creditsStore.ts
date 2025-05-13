import { create } from 'zustand';

interface CreditsState {
  credits: number | undefined;
  setCredits: (credits: number) => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  credits: undefined,
  setCredits: (credits: number) => set({ credits }),
}));