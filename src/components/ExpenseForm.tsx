// src/components/ExpenseForm.tsx (Example path)

import { useState, ChangeEvent, FormEvent, useEffect, Fragment } from "react";
import { DraftExpense, Value } from "../types"; // Adjust path if needed
import ErrorMessage from "./ErrorMessage"; // Adjust path if needed
import DatePicker from "react-date-picker";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import { useBudget } from "../hooks/useBudget"; // Adjust path if needed
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

// Small tolerance for floating point comparisons
const epsilon = 0.001;

export default function ExpenseForm() {
  // State for input strings and parsed numbers
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

  // Effect to populate form when editing
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
            category: editingExpense.category,
            date: typeof editingExpense.date === 'string' ? new Date(editingExpense.date) : editingExpense.date
        });
        setPreviousAmount(currentAmount);
      }
    } else {
        // Reset form when not editing (e.g., modal opens for new expense)
        setAmountInput("0");
        setExpense({
            amount: 0,
            expenseName: "",
            category: "",
            date: new Date(),
        });
        setPreviousAmount(0);
    }
    setError(""); // Clear error when editingId changes or form resets
  }, [state.editingId, state.expenses]);

  // --- Event Handlers ---

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountInput(value);
    const sanitizedValue = value.replace(',', '.');
    const parsedValue = parseFloat(sanitizedValue);
    if (!isNaN(parsedValue)) {
        setExpense(prev => ({ ...prev, amount: parsedValue }));
    } else if (value === "" || value === "-") {
         setExpense(prev => ({ ...prev, amount: 0 }));
    }
  };

  const handleCategoryChange = (selectedCategoryId: string) => {
      setExpense(prev => ({ ...prev, category: selectedCategoryId }));
  };

  const handleChangeDate = (value: Value) => {
    // Ensure value is not an array if DatePicker doesn't support ranges
    const dateToSet = Array.isArray(value) ? value[0] : value;
    setExpense({ ...expense, date: dateToSet });
  };

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
    const selectedCategory = state.CategoryBudgets.find(cat => cat.id === expense.category);
    if (!selectedCategory) { setError("Invalid category selected."); return; }
    const amountChange = expense.amount - previousAmount;
    if (amountChange > selectedCategory.value + epsilon) {
      setError(`Expense change (€${amountChange.toFixed(2)}) exceeds the remaining budget for category: ${selectedCategory.name} (€${selectedCategory.value.toFixed(2)} left).`); return;
    }
    if (amountChange > remainingBudget + epsilon) {
      setError(`Expense change (€${amountChange.toFixed(2)}) exceeds the overall remaining budget (€${remainingBudget.toFixed(2)} left).`); return;
    }

    // --- Dispatch Action ---
    if (state.editingId) {
      dispatch({ type: "update-expense", payload: { expense: { id: state.editingId, ...expense } } });
    } else {
      dispatch({ type: "add-expense", payload: { expense } });
    }
    // Close modal via reducer effects or explicitly if needed
    // dispatch({ type: 'close-modal' }); // Usually handled by reducer or modal onClose
    setError("");
  };

  // --- Helper to find selected category for display ---
  const selectedCategoryDisplay = state.CategoryBudgets.find(cat => cat.id === expense.category);

  // --- JSX ---
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <legend className="uppercase text-center text-2xl font-black border-b-4 border-blue-500 py-2 mb-5"> {/* Added mb-5 */}
        {state.editingId ? "Update Expense" : "Add New Expense"}
      </legend>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Expense Name Input */}
      <div className="flex flex-col gap-2">
         <label htmlFor="expenseName" className="text-md text-gray-600">Expense Name:</label>
         <input type="text" id="expenseName" placeholder="Enter the expense name" className=" bg-slate-50 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-200" name="expenseName" value={expense.expenseName} onChange={handleTextChange} />
      </div>

      {/* Amount Input */}
      <div className="flex flex-col gap-2">
         <label htmlFor="amount" className="text-md text-gray-600">Amount:</label>
         <input type="text" inputMode="decimal" id="amount" placeholder="0.00" className=" bg-slate-50 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-200" name="amount" value={amountInput} onChange={handleAmountChange} />
      </div>

      {/* === Category Listbox === */}
      <div className="flex flex-col gap-2">
        <Listbox value={expense.category} onChange={handleCategoryChange}>
          <Listbox.Label className="text-md text-gray-600">Category:</Listbox.Label>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded border border-slate-200 bg-slate-50 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
              <span className="block truncate">
                {selectedCategoryDisplay ? selectedCategoryDisplay.name : "--- Select ---"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              {/* *** Updated className: REMOVED max-h-* constraint *** */}
              <Listbox.Options
                className="absolute z-20 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                // ^^^^^^ NO max-h-* HERE & Added higher z-index (z-20) ^^^^^^
              >
                 {state.CategoryBudgets.length === 0 ? (
                   <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                     No categories defined in budget.
                   </div>
                ) : (
                  state.CategoryBudgets.map((category) => (
                    <Listbox.Option
                      key={category.id}
                      className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                      value={category.id}
                    >
                      {({ selected }) => ( // Removed 'active' from here if not used for styling checkmark etc.
                        <div className="flex justify-between items-center w-full">
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {category.name}
                          </span>
                          <span className={`ml-3 text-sm text-gray-500 ${selected ? 'font-semibold' : 'font-normal'}`}>
                            €{(typeof category.value === 'number' ? category.value : 0).toFixed(2)} left
                          </span>
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
         <label htmlFor="date" className="text-md text-gray-600">Expense Date:</label>
         <DatePicker id="date" className="bg-slate-50 p-2 border border-slate-200 rounded w-full focus:ring-blue-500 focus:border-blue-500" value={expense.date} onChange={handleChangeDate} maxDate={new Date()} />
      </div>

      {/* Submit Button */}
      <input
        type="submit"
        className="bg-blue-600 cursor-pointer w-full p-2 text-white uppercase font-bold rounded-lg hover:bg-blue-700 transition-colors mt-5" // Added mt-5
        value={state.editingId ? "Update Expense" : "Add Expense"}
      />
    </form>
  );
}