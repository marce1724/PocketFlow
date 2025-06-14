import { useState, ChangeEvent, FormEvent, useEffect, Fragment } from "react";
import { DraftExpense, CategoryBudgets } from "../types";
import ErrorMessage from "./ErrorMessage";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import { useBudget } from "../hooks/useBudget";
import { Listbox, Transition, Label, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { DatePicker } from '@tremor/react';
import { capitalize } from "../helpers";


// Small tolerance for floating point comparisons
const epsilon = 0.001;

export default function ExpenseForm() {
  const [amountInput, setAmountInput] = useState<string>("0");
  const [expense, setExpense] = useState<DraftExpense>({
    amount: 0,
    expenseName: "",
    category: "",
    date: new Date(),
  });

  const [error, setError] = useState("");
  const [previousAmount, setPreviousAmount] = useState(0);
  const { dispatch, state, remainingBudget = 0 } = useBudget();
  const isEditing = Boolean(state.editingId);
  const [originalCategory, setOriginalCategory] = useState<string>("");

  const [showTransferSourceSelector, setShowTransferSourceSelector] = useState(false);
  const [shortfall, setShortfall] = useState(0);
  const [sourceCategoryIdForTransfer, setSourceCategoryIdForTransfer] = useState<string | null>(null);
  const [eligibleCategoriesForTransfer, setEligibleCategoriesForTransfer] = useState<CategoryBudgets[]>([]);

  const resetTransferState = () => {
    setShowTransferSourceSelector(false);
    setShortfall(0);
    setSourceCategoryIdForTransfer(null);
    setEligibleCategoriesForTransfer([]);
  };

  useEffect(() => {
    if (state.editingId) {
      const editingExpense = state.expenses.find(
        (currentExpense) => currentExpense.id === state.editingId
      );

      if (editingExpense) {
        setOriginalCategory(editingExpense.category);
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
      setOriginalCategory("");
      setAmountInput("0");
      setExpense({
        amount: 0,
        expenseName: "",
        category: "",
        date: new Date(),
      });
      setPreviousAmount(0);
    }
    setError("");
    resetTransferState();
  }, [state.editingId, state.expenses]);



  const evaluateBudgetShortfall = (currentAmount: number, currentCategoryId: string) => {
    if (!currentCategoryId || isNaN(currentAmount) || currentAmount <= 0) {
      resetTransferState();
      setError(""); // Clear any previous deficit-related error
      return;
    }

    const primaryCategory = state.CategoryBudgets.find(cat => cat.id === currentCategoryId);
    if (!primaryCategory) {
      resetTransferState();
      setError(""); // Clear any previous deficit-related error
      return;
    }

    const primaryCategoryBudget = primaryCategory.value;

    // Prevent summation of original and new amount when calculating remaining
    const adjustedBudget = isEditing && originalCategory === currentCategoryId
      ? primaryCategoryBudget + previousAmount
      : primaryCategoryBudget;

    if (currentAmount > adjustedBudget + epsilon) { // Deficit exists
      const deficit = currentAmount - adjustedBudget;
      setShortfall(deficit);

      // Eligible categories are ALL other categories that have *some* positive budget.
      // The Listbox.Option itself will handle disabling/styling if it can't cover the *full* deficit.
      const potentialSources = state.CategoryBudgets.filter(cat =>
        cat.id !== currentCategoryId && cat.value > epsilon // Has *some* money
      );

      setEligibleCategoriesForTransfer(potentialSources);

      if (potentialSources.length > 0) {
        // If there are other categories with some funds, show the transfer options.
        // The UI of the source Listbox will indicate sufficiency for each option.
        setShowTransferSourceSelector(true);
        setError(""); // Clear previous errors, let the Listbox UI guide the user.
      } else {
        // Primary category has a deficit, AND no other categories have any funds at all.
        setShowTransferSourceSelector(false);
        setSourceCategoryIdForTransfer(null);
        setError(`"${primaryCategory.name}" has a deficit of €${deficit.toFixed(2)}, but no other categories have funds available to help cover this.`);
      }
    } else {
      // No deficit in the primary category
      resetTransferState();
      setError("");
    }
  };

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
      if (expense.category) {
        evaluateBudgetShortfall(parsedValue, expense.category);
      }
    } else if (value === "" || value === "-") {
      setExpense(prev => ({ ...prev, amount: 0 }));
      resetTransferState(); // Also reset deficit check if amount is cleared
      setError(""); // Clear any errors
    }
  };

  const handleCategoryChange = (selectedCategoryId: string) => {
    setExpense(prev => ({ ...prev, category: selectedCategoryId }));
    // Use the current amount from amountInput for consistency, as expense.amount might not be updated yet
    const currentValFromInput = parseFloat(amountInput.replace(',', '.')) || 0;
    evaluateBudgetShortfall(currentValFromInput, selectedCategoryId);
    setSourceCategoryIdForTransfer(null); // Reset source if primary category changes
  };

  const handleSourceCategoryChange = (selectedSourceId: string) => {
    setSourceCategoryIdForTransfer(selectedSourceId);
  };

  const handleChangeDate = (value: Date | null) => {
    if (value) {
      setExpense((prev) => ({ ...prev, date: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentExpenseAmount = parseFloat(amountInput.replace(',', '.')) || 0;
    const amountChanged = currentExpenseAmount !== previousAmount;
    const categoryChanged = expense.category !== originalCategory; // you may need to track this
    const budgetImpact = amountChanged || categoryChanged;
    if (isEditing && !budgetImpact) {
      // Only date or name changed — skip budget checks
      dispatch({
        type: "update-expense",
        payload: { expense: { id: state.editingId, ...expense, date: expense.date, amount: currentExpenseAmount } }
      });

      // Cleanup
      setAmountInput("0");
      setExpense({ amount: 0, expenseName: "", category: "", date: new Date() });
      setPreviousAmount(0);
      resetTransferState();
      setError("");
      return;
    }

    if (!expense.expenseName || !expense.category || currentExpenseAmount === null || currentExpenseAmount === undefined || isNaN(currentExpenseAmount)) {
      setError("Expense Name, Amount, and Category are required.");
      return;
    }
    if (currentExpenseAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (showTransferSourceSelector && sourceCategoryIdForTransfer && shortfall > 0) {
      if (state.editingId) {
        setError("Transferring budget from another category while editing an expense is not supported. Please adjust the amount or create a new expense.");
        return;
      }

      const primaryCategory = state.CategoryBudgets.find(cat => cat.id === expense.category);
      const sourceCategory = state.CategoryBudgets.find(cat => cat.id === sourceCategoryIdForTransfer);

      if (!primaryCategory || !sourceCategory) {
        setError("Invalid category selected for budget transfer. Please choose valid source and destination categories.");
        return;
      }
      // This check is crucial: the selected source MUST be able to cover the deficit
      if (shortfall > sourceCategory.value + epsilon) {
        setError(`The source category "${sourceCategory.name}" does not have sufficient funds (€${sourceCategory.value.toFixed(2)}) to cover the deficit of €${shortfall.toFixed(2)}. Please choose another source or reduce the amount.`);
        // It's important that Listbox.Option disabled prop prevents this, but this is a safeguard.
        return;
      }
      // Redundant check if above is thorough, but good for safety:
      // (primaryCategory.value (budget before this expense) + sourceCategory.value) vs currentExpenseAmount
      // currentExpenseAmount = primaryCategory.value (what it can cover) + shortfall
      // So we need sourceCategory.value >= shortfall. This is covered by the check above.

      if (currentExpenseAmount > remainingBudget + epsilon) {
        setError(`The total expense of €${currentExpenseAmount.toFixed(2)} exceeds the overall remaining budget of €${remainingBudget.toFixed(2)} available.`);
        return;
      }

      dispatch({
        type: "transfer-budget",
        payload: {
          from: sourceCategoryIdForTransfer,
          to: expense.category,
          amount: shortfall
        }
      });

      dispatch({
        type: "add-expense",
        payload: { expense: { ...expense, amount: currentExpenseAmount } }
      });

    } else {
      const selectedCategoryBudgetInfo = state.CategoryBudgets.find(cat => cat.id === expense.category);
      if (!selectedCategoryBudgetInfo) { setError("Invalid category selected."); return; }

      // const amountChange = currentExpenseAmount - (state.editingId ? previousAmount : 0);

      // If budget transfer options were available (showTransferSourceSelector = true) but no source was picked
      if (showTransferSourceSelector && !sourceCategoryIdForTransfer && currentExpenseAmount > selectedCategoryBudgetInfo.value + epsilon) {
        setError(`Please select a category to cover the deficit of €${shortfall.toFixed(2)} for "${selectedCategoryBudgetInfo.name}", or reduce the expense amount.`);
        return;
      }
      // If budget transfer options were NOT available (e.g. evaluateBudgetShortfall set an error because no other categories have funds)
      // OR if there's a deficit and transfer options were not relevant (e.g. currentAmount <= selectedCategoryBudgetInfo.value after some interaction)
      // This is the general "insufficient funds for primary category" check
      const effectiveBudget = (isEditing && originalCategory === expense.category)
        ? selectedCategoryBudgetInfo.value + previousAmount
        : selectedCategoryBudgetInfo.value;
      if (currentExpenseAmount > effectiveBudget + epsilon && !showTransferSourceSelector) {
        // The error would have been set by evaluateBudgetShortfall if !showTransferSourceSelector is due to no other cats having funds.
        // This condition here acts as a fallback or if error was cleared.
        if (!error) { // Only set if evaluateBudgetShortfall didn't already set a more specific one
          setError(`The expense (€${currentExpenseAmount.toFixed(2)}) exceeds the budget for category: ${selectedCategoryBudgetInfo.name} (€${selectedCategoryBudgetInfo.value.toFixed(2)} available).`);
        }
        return;
      }


      if (!state.editingId && currentExpenseAmount > remainingBudget + epsilon) {
        setError(`The expense (€${currentExpenseAmount.toFixed(2)}) exceeds the overall remaining budget (€${remainingBudget.toFixed(2)} available).`);
        return;
      }

      if (state.editingId) {
        dispatch({ type: "update-expense", payload: { expense: { id: state.editingId, ...expense, date: expense.date, amount: currentExpenseAmount } } });
      } else {
        dispatch({ type: "add-expense", payload: { expense: { ...expense, date: expense.date, amount: currentExpenseAmount } } });
      }
    }

    setAmountInput("0");
    setExpense({ amount: 0, expenseName: "", category: "", date: new Date() });
    setPreviousAmount(0);
    resetTransferState();
    setError("");
  };

  const selectedCategoryDisplay = state.CategoryBudgets.find(cat => cat.id === expense.category);
  const selectedSourceCategoryDisplay = state.CategoryBudgets.find(cat => cat.id === sourceCategoryIdForTransfer);

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>

      <legend className="uppercase text-center text-2xl font-black border-b-4 border-blue-500 py-2 mb-5">
        {state.editingId ? "Update Expense" : "Add New Expense"}
      </legend>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Expense Name, Amount, Primary Category Listbox */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expenseName" className="text-md text-gray-600">Expense Name:</label>
        <input type="text" id="expenseName" placeholder="Enter the expense name" className=" bg-slate-50 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-200" name="expenseName" value={expense.expenseName} onChange={handleTextChange} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="amount" className="text-md text-gray-600">Amount:</label>
        <input type="text" inputMode="decimal" id="amount" placeholder="0.00" className=" bg-slate-50 p-2 rounded focus:ring-blue-500 focus:border-blue-500 border border-slate-200" name="amount" value={amountInput === "0" ? "" : amountInput} onChange={handleAmountChange} />
      </div>

      <div className="flex flex-col gap-2">
        <Listbox value={expense.category} onChange={handleCategoryChange}>
          <Listbox.Label className="text-md text-gray-600">Category:</Listbox.Label>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded border border-slate-200 bg-slate-50 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
              <span className="block truncate">
                {selectedCategoryDisplay ? selectedCategoryDisplay.name : "--- Select Category ---"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-20 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {state.CategoryBudgets.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No categories defined.
                  </div>
                ) : (
                  state.CategoryBudgets.map((category) => (
                    <Listbox.Option
                      key={category.id}
                      className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                      value={category.id}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center w-full">
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {capitalize(category.name)}
                          </span>
                          <span className={`ml-3 text-sm ${category.value < expense.amount ? 'text-red-500' : 'text-gray-500'} ${selected ? 'font-semibold' : 'font-normal'}`}>
                            €{category.value} left
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

      {/* === Source Category Listbox (for bugdet transfer expense) === */}
      {showTransferSourceSelector && ( // Simplified condition: just show if flag is true
        <div className="flex flex-col gap-2 mt-4 p-3 border border-blue-300 rounded-md bg-blue-50">
          <p className="text-sm text-blue-800 font-medium">
            The amount for "{selectedCategoryDisplay?.name}" has a shortfall of €{shortfall.toFixed(2)}.
          </p>
          {eligibleCategoriesForTransfer.length > 0 ? (
            <Listbox value={sourceCategoryIdForTransfer} onChange={handleSourceCategoryChange}>
              <Label className="text-md text-gray-600">Cover shortfall from:</Label>
              <div className="relative mt-1">
                <ListboxButton className="relative w-full cursor-default rounded border border-slate-200 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                  <span className="block truncate">
                    {selectedSourceCategoryDisplay ? selectedSourceCategoryDisplay.name : "--- Select Source Category ---"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <ListboxOptions className="absolute z-30 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {eligibleCategoriesForTransfer.map((category) => (
                      <ListboxOption
                        key={category.id}
                        className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                        value={category.id}
                        disabled={category.value < shortfall - epsilon} // Crucial: disable if it can't cover full deficit
                      >
                        {({ selected, disabled }) => (
                          <div className="flex justify-between items-center w-full">
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'} ${disabled ? 'text-gray-400' : ''}`}>
                              {category.name}
                            </span>
                            <span className={`ml-3 text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'} ${selected ? 'font-semibold' : 'font-normal'}`}>
                              €{(typeof category.value === 'number' ? category.value : 0).toFixed(2)} left
                              {category.value < shortfall - epsilon && " (Insufficient to cover shortfall)"}
                            </span>
                          </div>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No other categories have funds available.</p>
            // This message should ideally not show if evaluateBudgetShortfall already set a more global error.
            // The error state should be the primary source of truth for "no options".
            // However, evaluateBudgetShortfall now sets showTransferSourceSelector to false if eligibleCategoriesForTransfer would be empty.
            // So this internal 'else' for eligibleCategoriesForTransfer.length > 0 might be redundant if error is already set.
            // The outer check `showTransferSourceSelector &&` means this part only renders if `evaluateBudgetShortfall` decided it should.
            // `evaluateBudgetShortfall` now sets `showTransferSourceSelector` to `false` if `potentialSources.length` is 0.
            // So this internal check for `eligibleCategoriesForTransfer.length > 0` is good.
          )}
        </div>
      )}

      {/* Date Picker and Submit Button */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expenseDate" className="text-md text-gray-600">Expense Date:</label>
        <DatePicker
          id="expenseDate"
          value={expense.date}
          onValueChange={(value) => {
            if (value instanceof Date && !isNaN(value.getTime())) {
              handleChangeDate(value);
            }
          }}
          maxDate={new Date()}
          enableClear={false}
          placeholder="Select date"
          className="w-full"
        />
      </div>

      <input
        type="submit"
        className="bg-blue-600 cursor-pointer w-full p-2 text-white uppercase font-bold rounded-lg hover:bg-blue-700 transition-colors mt-5"
        value={state.editingId ? "Update Expense" : "Add Expense"}
      />

    </form>
  );
}