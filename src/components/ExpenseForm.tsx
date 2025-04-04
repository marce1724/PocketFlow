import { useState, ChangeEvent, FormEvent, useEffect, Fragment } from "react"; // Added Fragment
import { DraftExpense, Value } from "../types";
import ErrorMessage from "./ErrorMessage";
import DatePicker from "react-date-picker";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import { useBudget } from "../hooks/useBudget";
import { Listbox, Transition } from '@headlessui/react'; // Import Listbox
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'; // Import icons (CheckIcon is optional)

// Small tolerance for floating point comparisons
const epsilon = 0.001;

export default function ExpenseForm() {
  // Separate state for input string and parsed number for amount
  const [amountInput, setAmountInput] = useState<string>("0");
  const [expense, setExpense] = useState<DraftExpense>({
    amount: 0, // Parsed numeric value
    expenseName: "",
    category: "", // Store category ID
    date: new Date(),
  });

  const [error, setError] = useState("");
  const [previousAmount, setPreviousAmount] = useState(0);
  const { dispatch, state, remainingBudget = 0 } = useBudget();

  useEffect(() => {
    if (state.editingId) {
      const editingExpense = state.expenses.find(
        (currentExpense) => currentExpense.id === state.editingId
      );
      if (editingExpense) {
        const currentAmount = typeof editingExpense.amount === 'number' ? editingExpense.amount : 0;
        setAmountInput(currentAmount.toString());
        setExpense({
            amount: currentAmount,
            expenseName: editingExpense.expenseName,
            category: editingExpense.category, // Set category ID
            date: typeof editingExpense.date === 'string' ? new Date(editingExpense.date) : editingExpense.date
        });
        setPreviousAmount(currentAmount);
      }
    } else {
        // Reset form when not editing
        setAmountInput("0");
        setExpense({
            amount: 0,
            expenseName: "",
            category: "", // Reset category ID
            date: new Date(),
        });
        setPreviousAmount(0);
    }
    setError(""); // Clear error when editingId changes or form resets
  }, [state.editingId, state.expenses]); // Depend on editingId and expenses list

  // Handle changes for text inputs (like expenseName)
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setExpense(prev => ({ ...prev, [name]: value }));
  };

  // Handle change specifically for the amount input (parsing text to number)
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountInput(value); // Update displayed string

    const sanitizedValue = value.replace(',', '.');
    const parsedValue = parseFloat(sanitizedValue);

    if (!isNaN(parsedValue)) {
        setExpense(prev => ({ ...prev, amount: parsedValue })); // Update numeric state
    } else if (value === "" || value === "-") {
         setExpense(prev => ({ ...prev, amount: 0 }));
    }
    // If parsing fails, numeric state 'expense.amount' retains last valid value
  };

  // Handle change for the custom Listbox component (receives category ID)
  const handleCategoryChange = (selectedCategoryId: string) => {
      setExpense(prev => ({ ...prev, category: selectedCategoryId }));
  };

  // Handle change for DatePicker
  const handleChangeDate = (value: Value) => {
    setExpense({ ...expense, date: value });
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- Validation ---
    if (!expense.expenseName || !expense.category || expense.amount === null || expense.amount === undefined || isNaN(expense.amount)) {
        setError("Expense Name, Amount, and Category are required.");
        return;
    }
     if (expense.amount <= 0) {
        setError("Amount must be greater than zero.");
        return;
    }

    const selectedCategory = state.CategoryBudgets.find(
      (category) => category.id === expense.category
    );

    if (!selectedCategory) {
      setError("Invalid category selected."); // Should not happen with Listbox if populated correctly
      return;
    }

    const amountChange = expense.amount - previousAmount;

    // Check against category budget
    if (amountChange > selectedCategory.value + epsilon) {
      setError(
        `Expense change (€${amountChange.toFixed(2)}) exceeds the remaining budget for category: ${selectedCategory.name} (€${selectedCategory.value.toFixed(2)} left).`
      );
      return;
    }

    // Check against overall remaining budget
    if (amountChange > remainingBudget + epsilon) {
      setError(`Expense change (€${amountChange.toFixed(2)}) exceeds the overall remaining budget (€${remainingBudget.toFixed(2)} left).`);
      return;
    }

    // --- Dispatch Action ---
    if (state.editingId) {
      dispatch({
        type: "update-expense",
        payload: { expense: { id: state.editingId, ...expense } },
      });
    } else {
      dispatch({
        type: "add-expense",
        payload: { expense },
      });
    }

    // Form reset is handled by useEffect when editingId changes (modal closes)
    setError(""); // Clear error on success
  };

  // Find the currently selected category object to display its name in the button
  const selectedCategoryDisplay = state.CategoryBudgets.find(cat => cat.id === expense.category);

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <legend className="uppercase text-center text-2xl font-black border-b-4 border-blue-500 py-2">
        {state.editingId ? "Update Expense" : "Add New Expense"}
      </legend>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Expense Name Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expenseName" className="text-xl">
          Expense Name:
        </label>
        <input
          type="text"
          id="expenseName"
          placeholder="Enter the expense name"
          className="bg-slate-100 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-300" // Added focus/border
          name="expenseName"
          value={expense.expenseName}
          onChange={handleTextChange} // Use specific handler
        />
      </div>

      {/* Amount Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="amount" className="text-xl">
          Amount:
        </label>
        <input
          type="text" // Use text
          inputMode="decimal" // Hint keyboard
          id="amount"
          placeholder="0.00"
          className="bg-slate-100 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-300" // Added focus/border
          name="amount"
          value={amountInput} // Bind to string state
          onChange={handleAmountChange} // Use specific handler
        />
      </div>

      {/* === Category Listbox (Replaces Select) === */}
      <div className="flex flex-col gap-2">
        <Listbox value={expense.category} onChange={handleCategoryChange}>
          {/* Label associated with the button via Listbox.Label or manually */}
          <Listbox.Label className="text-xl">Category:</Listbox.Label>
          <div className="relative mt-1"> {/* Adjusted margin */}
            <Listbox.Button className="relative w-full cursor-default rounded border border-slate-300 bg-slate-100 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
              <span className="block truncate">
                {/* Display selected category name or placeholder */}
                {selectedCategoryDisplay ? selectedCategoryDisplay.name : "--- Select ---"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {/* Handle case where no categories are defined */}
                {state.CategoryBudgets.length === 0 ? (
                   <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                     No categories defined in budget.
                   </div>
                ) : (
                  // Map over available categories
                  state.CategoryBudgets.map((category) => (
                    <Listbox.Option
                      key={category.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-4 ${ // Adjusted padding
                          active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                        }`
                      }
                      value={category.id} // The value passed to onChange
                    >
                      {({ selected, active }) => (
                        // Flex container for two columns
                        <div className="flex justify-between items-center w-full">
                          {/* Column 1: Category Name */}
                          <span
                            className={`block truncate ${
                              selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {category.name}
                          </span>
                          {/* Column 2: Available Amount */}
                          <span
                            className={`ml-3 text-sm ${ // Added margin-left
                                active ? 'text-blue-800' : 'text-gray-500'
                            } ${
                                selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {/* Display formatted remaining value */}
                            €{(typeof category.value === 'number' ? category.value : 0).toFixed(2)} left
                          </span>
                          {/* Optional: Checkmark for selected item */}
                          {/* {selected ? (
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-amber-600' : 'text-amber-600'}`}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null} */}
                        </div>
                      )}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
      {/* === End Category Listbox === */}


      {/* Date Picker */}
      <div className="flex flex-col gap-2">
        <label htmlFor="date" className="text-xl"> {/* Ensure label exists if DatePicker needs it */}
          Expense Date:
        </label>
        <DatePicker
          id="date" // Add id if needed for label
          className="bg-slate-100 p-2 border-0 rounded w-full focus:ring-blue-500 focus:border-blue-500" // Added focus/border
          value={expense.date}
          onChange={handleChangeDate}
          maxDate={new Date()} // Prevent future dates
        />
      </div>

      {/* Submit Button */}
      <input
        type="submit"
        className="bg-blue-600 cursor-pointer w-full p-2 text-white uppercase font-bold rounded-lg hover:bg-blue-700 transition-colors"
        value={state.editingId ? "Update Expense" : "Add Expense"}
      />
    </form>
  );
}