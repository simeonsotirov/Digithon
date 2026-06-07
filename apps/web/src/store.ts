import { create } from "zustand";

type UiState = {
  selectedStore: string;
  selectedRun: string;
  setSelectedStore: (store: string) => void;
  setSelectedRun: (run: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedStore: "all",
  selectedRun: "all",
  setSelectedStore: (selectedStore) => set({ selectedStore }),
  setSelectedRun: (selectedRun) => set({ selectedRun }),
}));
