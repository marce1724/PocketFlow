

import { ChangeEvent, useMemo } from "react";
// Remove the static import: import { categories } from "../data/categories";
import { useBudget } from "../hooks/useBudget";

export default function FilterByCategory() {
  // Get both state and dispatch from the hook
  const { state, dispatch } = useBudget();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "add-filter-category", payload: { id: e.target.value } });
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
            <label htmlFor="category-filter" className="md:w-1/4"> {/* Adjusted label width */}
              Filter Expenses:
            </label>
            <select
              id="category-filter" // Use a unique ID if 'category' is used elsewhere
              className="bg-slate-100 p-3 flex-1 rounded"
              onChange={handleChange}
              // Control the component: Set value to the current filter in the state
              value={state.currentCategory}
            >
              {/* Option to show all expenses */}
              <option value="">-- Show All --</option>

              {/* Map over the categories from the budget state */}
              {availableFilterCategories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      ) : (
        <p className="text-center text-gray-500">No budget categories defined yet to filter by.</p>
      )}
    </div>
  );
}