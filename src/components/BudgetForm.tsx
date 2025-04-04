
import React, { useState, ChangeEvent, useMemo, FormEvent, useEffect } from "react";
import { useBudget } from "../hooks/useBudget";
import ErrorMessage from "./ErrorMessage";
import { CategoryBudgets } from "../types";

// Define props for the component
type BudgetFormProps = {
    onBudgetSet: () => void; // Callback to signal completion
    currentBudget?: number; // Optional: Current total budget for pre-filling
    currentCategoryBudgets?: CategoryBudgets[]; // Optional: Current category budgets for pre-filling
};

// Define the structure of the local 'budgets' state (both numeric and string)
type LocalBudgetsState = {
    insurance: number;
    rent: number;
    groceries: number;
    travel: number;
    coffee: number;
    general: number;
    savings: number;
    restaurant: number;
};
// Type for the string input state
type LocalBudgetsInputState = Record<keyof LocalBudgetsState, string>;

// Default values for the numeric state
const defaultLocalBudgets: LocalBudgetsState = {
    insurance: 0, rent: 0, groceries: 0, travel: 0,
    coffee: 0, general: 0, savings: 0, restaurant: 0,
};

// Helper to create default string state from numeric defaults
const createDefaultInputState = (defaults: LocalBudgetsState): LocalBudgetsInputState => {
    return (Object.keys(defaults) as Array<keyof LocalBudgetsState>).reduce((acc, key) => {
        acc[key] = defaults[key].toString(); // Initialize string state from numeric default
        return acc;
    }, {} as LocalBudgetsInputState);
};

// Small tolerance for floating point comparisons
const epsilon = 0.001;

export default function BudgetForm({ onBudgetSet, currentBudget, currentCategoryBudgets }: BudgetFormProps) {

    // State for the raw input string (for display) and the parsed number (for calculation)
    const [budgetInput, setBudgetInput] = useState<string>( (currentBudget ?? 0).toString() );
    const [budget, setBudget] = useState(currentBudget ?? 0); // Parsed numeric value

    // Initialize string and numeric states for category budgets
    const [budgetsInput, setBudgetsInput] = useState<LocalBudgetsInputState>(createDefaultInputState(defaultLocalBudgets));
    const [budgets, setBudgets] = useState<LocalBudgetsState>(defaultLocalBudgets); // Parsed numeric values

    const [error, setError] = useState<string | null>(null);
    const { dispatch, state } = useBudget();

    // Effect to pre-fill form when props are available (for update mode)
    useEffect(() => {
        const initialTotalBudget = currentBudget ?? 0;
        setBudgetInput(initialTotalBudget.toString());
        setBudget(initialTotalBudget);

        // Start with default structures
        const initialNumericBudgets = { ...defaultLocalBudgets };
        const initialStringBudgets = createDefaultInputState(defaultLocalBudgets);

        if (currentCategoryBudgets && currentCategoryBudgets.length > 0) {
            currentCategoryBudgets.forEach(cat => {
                 const spentInCategory = state.expenses
                    .filter(exp => exp.category === cat.id)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                 const currentRemaining = typeof cat.value === 'number' ? cat.value : 0;
                 const allocatedAmount = currentRemaining + spentInCategory;

                // Check if the category name from props exists as a key in our state
                if (cat.name in initialNumericBudgets) {
                    const key = cat.name as keyof LocalBudgetsState; // Assert key type
                    initialNumericBudgets[key] = allocatedAmount;
                    initialStringBudgets[key] = allocatedAmount.toString(); // Update string state too
                }
            });
        }
        setBudgets(initialNumericBudgets); // Set the pre-filled numeric budgets
        setBudgetsInput(initialStringBudgets); // Set the pre-filled string budgets

        setError(null);
    }, [currentBudget, currentCategoryBudgets, state.expenses]);


    // Handle change for Total Budget
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setBudgetInput(rawValue); // Update the displayed string value

        const sanitizedValue = rawValue.replace(',', '.');
        const parsedValue = parseFloat(sanitizedValue);

        if (!isNaN(parsedValue)) {
            setBudget(parsedValue);
            validateBudgets(parsedValue, budgets);
        } else if (rawValue === "" || rawValue === "-") {
             setBudget(0);
             validateBudgets(0, budgets);
        } else {
             validateBudgets(budget, budgets); // Validate with last known valid number
        }
    };

    // Handle change for individual budgets
    const handleBudgetsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Ensure name is a valid key before proceeding
        if (!(name in defaultLocalBudgets)) return; // Or handle error
        const key = name as keyof LocalBudgetsState;

        // Update the specific input string state
        setBudgetsInput(prev => ({ ...prev, [key]: value }));

        const sanitizedValue = value.replace(',', '.');
        const parsedValue = parseFloat(sanitizedValue);

        // Create a mutable copy for potential update
        const updatedNumericBudgets = { ...budgets };

        if (!isNaN(parsedValue)) {
            updatedNumericBudgets[key] = parsedValue;
            setBudgets(updatedNumericBudgets); // Update numeric state
            validateBudgets(budget, updatedNumericBudgets); // Validate
        } else if (value === "" || value === "-") {
             updatedNumericBudgets[key] = 0;
             setBudgets(updatedNumericBudgets);
             validateBudgets(budget, updatedNumericBudgets);
        } else {
             // Keep last valid number if parsing fails, re-validate
             validateBudgets(budget, budgets);
        }
    };

    // Combined validation logic (uses numeric state 'budgets')
    const validateBudgets = (currentTotal: number, currentCategories: LocalBudgetsState) => {
        const totalAllocated = Object.values(currentCategories).reduce((sum, val) => sum + (val || 0), 0);
        if (totalAllocated > currentTotal + epsilon) {
            setError(`Total allocated budget (${totalAllocated.toFixed(2)}) cannot exceed the total budget (${currentTotal.toFixed(2)}).`);
            return false;
        } else {
            setError(null);
            return true;
        }
    };


    // Calculate remaining budget based on NUMERIC state
    const remainingBudget = useMemo(() => {
        const totalAllocated = Object.values(budgets).reduce((sum, val) => sum + (val || 0), 0);
        return budget - totalAllocated;
    }, [budget, budgets]);

    // Validate form for submission (uses numeric state)
    const isValidForSubmit = useMemo(() => {
        return Math.abs(remainingBudget) < epsilon && !error;
    }, [remainingBudget, error]);

    // Handle form submission (uses numeric state)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateBudgets(budget, budgets) || Math.abs(remainingBudget) >= epsilon) {
             if (Math.abs(remainingBudget) >= epsilon) {
                 setError(`The remaining budget must be exactly 0 before submitting (currently ${remainingBudget.toFixed(2)}). Adjust values.`);
             }
            return;
        }

        // Prepare data for dispatch using numeric state 'budgets'
        const categoryBudgetsForDispatch: CategoryBudgets[] = Object.entries(budgets).map(([key, value], index) => ({
            id: (index + 1).toString(), // Adjust ID generation if needed
            name: key,
            value: value || 0,
        }));

        dispatch({
            type: "add-budget",
            payload: {
                budget: budget || 0,
                CategoryBudgets: categoryBudgetsForDispatch,
            },
        });

        onBudgetSet();
        setError(null);
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-center text-blue-600">
                {currentBudget !== undefined ? 'Update Budget' : 'Define Budget'}
            </h2>

            {/* Row for Total Budget and Remaining Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className="flex flex-col space-y-1">
                    <label className="text-sm text-gray-600 font-medium" htmlFor="budgetId">
                        Total Budget
                    </label>
                    <input
                        id="budgetId"
                        name="budget"
                        type="text" // Use text
                        inputMode="decimal" // Hint for keyboard
                        className="bg-white border border-gray-300 p-2 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        value={budgetInput} // Bind to string state
                        onChange={handleChange}
                    />
                </div>
                <div className="text-right self-end pb-2">
                    <span className={`text-sm font-semibold ${remainingBudget < -epsilon ? "text-red-600" : "text-gray-500"}`}>
                        Remaining to Allocate: {remainingBudget.toFixed(2)}
                    </span>
                </div>
            </div>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <div className="border-t border-gray-300 border-dashed pt-5 mt-2"></div>

            <p className="text-sm text-gray-600 font-medium mb-3">Allocate Budget per Category:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                 {/* Iterate over the keys of the defined state structure */}
                {(Object.keys(defaultLocalBudgets) as Array<keyof LocalBudgetsState>).map((key) => (
                    <div className="flex flex-col space-y-1" key={key}>
                        <label className="text-sm text-gray-500 capitalize" htmlFor={`${key}Id`}>
                            {key}
                        </label>
                        <input
                            id={`${key}Id`}
                            name={key} // Name must match the key
                            type="text" // Use text
                            inputMode="decimal" // Hint for keyboard
                            className="bg-white border border-gray-300 p-2 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            value={budgetsInput[key]} // Bind to the specific key in string state
                            onChange={handleBudgetsChange}
                        />
                    </div>
                ))}
            </div>

            <input
                type="submit"
                value={currentBudget !== undefined ? "Update Budget" : "Set Budget"}
                className="bg-blue-600 hover:bg-blue-700 cursor-pointer w-full p-3 text-white font-bold uppercase disabled:opacity-50 rounded-lg mt-6 transition duration-150 ease-in-out"
                disabled={!isValidForSubmit}
            />
        </form>
    );
}