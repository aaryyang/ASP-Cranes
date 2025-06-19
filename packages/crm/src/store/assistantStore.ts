import { create } from 'zustand';

interface AssistantState {
  isOpen: boolean;
  toggleAssistant: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
}

export const useAssistantStore = create<AssistantState>()((set) => ({
  isOpen: false, // Always start closed
  toggleAssistant: () => set((state) => ({ isOpen: !state.isOpen })),
  openAssistant: () => set({ isOpen: true }),
  closeAssistant: () => set({ isOpen: false }),
}));
