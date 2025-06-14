

import { useMemo } from "react";
// Remove the static import: import { categories } from "../data/categories";
import { useBudget } from "../hooks/useBudget";
import { Select, SelectItem } from "@tremor/react";
import { capitalize } from "../helpers";

export default function FilterByCategory() {
  // Get both state and dispatch from the hook
  const { state, dispatch } = useBudget();

  const handleChange = (value: string) => {
    dispatch({ type: "add-filter-category", payload: { id: value } });
  };

  // Use the categories defined in the budget state for filtering options
  const availableFilterCategories = useMemo(() => {
      // You could also filter further here if needed, e.g., only show categories
      // that actually have expenses associated with them, but using CategoryBudgets
      // directly is a good starting point.
      return state.CategoryBudgets || [];
  }, [state.CategoryBudgets]);

  // Only show the filter if there are categories defined in the budget
  const showFilter = availableFilterCategories.length > 0;

  return (
    <div className="bg-white shadow-lg rounded-lg p-10 mb-5"> {/* Added mb-5 for spacing */}
      {showFilter ? (
        <form>
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <label htmlFor="category-filter" className="md:w-1/4">
              Filter Expenses:
            </label>

            <Select
              id="category-filter"
              value={state.currentCategory}
              onValueChange={handleChange} // Same handler as before
              className="flex-1 p-3 rounded"
            >
              <SelectItem value="">-- Show All --</SelectItem>
              {availableFilterCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {capitalize(category.name)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </form>
      ) : (
        <p className="text-center text-gray-500">No budget categories defined yet to filter by.</p>
      )}
    </div>
  );
}