import { create } from 'zustand';
import { SyncQueueItem } from '@/src/types';
import { getAllFromLocal, saveToLocal, deleteFromLocal } from '@/src/lib/offline.ts';

interface SyncState {
  queue: SyncQueueItem[];
  isSyncing: boolean;
  isOnline: boolean;
  loadQueue: () => Promise<void>;
  setOnline: (online: boolean) => void;
  triggerSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  queue: [],
  isSyncing: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  loadQueue: async () => {
    const queue = await getAllFromLocal('sync_queue');
    set({ queue: queue as SyncQueueItem[] });
  },

  setOnline: (online) => set({ isOnline: online }),

  triggerSync: async () => {
    const { isOnline, isSyncing, queue } = get();
    if (!isOnline || isSyncing || queue.length === 0) return;

    set({ isSyncing: true });
    
    // In a real implementation, this would iterate through items and call API routes
    console.log('Syncing items:', queue.length);
    
    // Simulate sync
    for (const item of queue) {
      try {
        // const response = await fetch(`/api/sync`, { method: 'POST', body: JSON.stringify(item) });
        // if (response.ok) {
          await deleteFromLocal('sync_queue', item.id);
        // }
      } catch (err) {
        console.error('Sync failed for item', item.id, err);
      }
    }

    const updatedQueue = await getAllFromLocal('sync_queue');
    set({ queue: updatedQueue as SyncQueueItem[], isSyncing: false });
  },
}));
