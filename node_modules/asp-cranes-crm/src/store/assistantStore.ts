import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AssistantState {
  isOpen: boolean;
  toggleAssistant: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      isOpen: false,
      toggleAssistant: () => set((state) => ({ isOpen: !state.isOpen })),
      openAssistant: () => set({ isOpen: true }),
      closeAssistant: () => set({ isOpen: false }),
    }),
    {
      name: 'assistant-storage',
    }
  )
);
