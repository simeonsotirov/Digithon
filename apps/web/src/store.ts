import { create } from "zustand";

type UiState = {
  selectedStore: string;
  selectedRun: string;
  selectedRisk: string;
  setSelectedStore: (store: string) => void;
  setSelectedRun: (run: string) => void;
  setSelectedRisk: (risk: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedStore: "all",
  selectedRun: "all",
  selectedRisk: "all",
  setSelectedStore: (selectedStore) => set({ selectedStore }),
  setSelectedRun: (selectedRun) => set({ selectedRun }),
  setSelectedRisk: (selectedRisk) => set({ selectedRisk }),
}));
