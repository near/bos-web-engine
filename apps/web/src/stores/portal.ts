import { create } from 'zustand';

interface PortalState {
  portal: HTMLDivElement | undefined;
  setPortal: (element: HTMLDivElement | undefined) => void;
}

export const usePortalStore = create<PortalState>((set) => ({
  portal: undefined,
  setPortal: (portal) => set({ portal }),
}));
