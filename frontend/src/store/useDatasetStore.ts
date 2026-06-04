import { create } from 'zustand';

export interface ColumnInfo {
  name: string;
  type: string;
  unique_values: number;
  missing_percentage: number;
}

export interface DatasetSummary {
  _id?: string;
  id?: string;
  filename: string;
  file_path: string;
  target_column: string | null;
  rows: number;
  columns: number;
  memory_usage_bytes: number;
  missing_percentage_total: number;
  duplicate_rows: number;
  columns_info: ColumnInfo[];
  can_undo?: boolean;
  can_redo?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DatasetState {
  summary: DatasetSummary | null;
  isLoading: boolean;
  error: string | null;
  chatHistory: ChatMessage[];
  setSummary: (summary: DatasetSummary) => void;
  setTarget: (target: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  reset: () => void;
}

import { persist } from 'zustand/middleware';

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set) => ({
      summary: null,
      isLoading: false,
      error: null,
      chatHistory: [],
      setSummary: (summary) => set({ summary, error: null }),
      setTarget: (target) => set((state) => ({ 
        summary: state.summary ? { ...state.summary, target_column: target } : null 
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
      clearChatHistory: () => set({ chatHistory: [] }),
      reset: () => set({ summary: null, error: null, isLoading: false, chatHistory: [] })
    }),
    {
      name: 'dataset-storage', // key in localStorage
    }
  )
);
