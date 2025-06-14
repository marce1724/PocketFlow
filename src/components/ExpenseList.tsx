import { useMemo } from "react";
import { useBudget } from "../hooks/useBudget";
import ExpenseDetail from "./ExpenseDetails";

// Import functions from date-fns
import { isToday as dateFnsIsToday } from 'date-fns';

export default function ExpenseList() {
    const { state } = useBudget();

    // Filter expenses (remains the same)
    const filteredExpenses = useMemo(() => {
        if (state.currentCategory) {
            return state.expenses.filter(expense => expense.category === state.currentCategory);
        }
        return state.expenses;
    }, [state.expenses, state.currentCategory]);

    // Sort: Today's expenses first, then newest to oldest using date-fns
    const sortedExpenses = useMemo(() => {
        // Create a shallow copy before sorting
        return [...filteredExpenses].sort((a, b) => {
            const dateA = a.date
            const dateB = b.date

            // Handle cases where dates couldn't be parsed (sort them last)
            if (!dateA && !dateB) return 0; // Keep original order if both invalid
            if (!dateA) return 1;          // Put invalid A after valid B
            if (!dateB) return -1;         // Put invalid B after valid A

            // Now we know both dateA and dateB are valid Date objects
            const isTodayA = dateFnsIsToday(dateA);
            const isTodayB = dateFnsIsToday(dateB);

            // Rule 1: If A is today and B is not, A comes first
            if (isTodayA && !isTodayB) {
                return -1;
            }
            // Rule 2: If B is today and A is not, B comes first
            if (!isTodayA && isTodayB) {
                return 1;
            }
            // Rule 3: If both are today OR both are not today, sort by timestamp descending (newest first)
            return dateB.getTime() - dateA.getTime();
        });
    }, [filteredExpenses]); // Re-sort only when filtered expenses change

    const isEmpty = useMemo(() => sortedExpenses.length === 0, [sortedExpenses]);

    return (
        <div className="mt-10 bg-white shadow-lg rounded-lg p-10">
            {isEmpty ? (
                <p className=" text-gray-500 text-2xl font-bold tracking-wider text-center">No Transactions</p>
            ) : (
                <>
                    <p className=" text-gray-600 text-2xl font-bold my-5 text-center">Transactions List</p>
                    {sortedExpenses.map(expense => (
                        <ExpenseDetail
                            key={expense.id}
                            expense={expense}
                            // Note: The TypeScript error regarding the missing 'label' prop
                            // for AmountDisplay inside ExpenseDetail is intentionally left unfixed here.
                        />
                    ))}
                </>
            )}
        </div>
    );
}