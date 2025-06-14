// src/types/AppState.ts
import { CategoryBudgets, Expense } from "../types";

export type AppState = {
  budget: number;
  CategoryBudgets: CategoryBudgets[];
  expenses: Expense[];
  currentCategory: string;
  editingId: string | null;
  // Add other fields if your state includes more
};