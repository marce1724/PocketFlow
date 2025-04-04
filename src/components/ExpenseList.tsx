import { useMemo } from "react";
import { useBudget } from "../hooks/useBudget";
import ExpenseDetail from "./ExpenseDetails";
import { Value } from "../types"; // Assuming Value is Date | null | [Date | null, Date | null]

// Import functions from date-fns
import { parse, isToday as dateFnsIsToday, isValid as isDateValid } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale

// Helper function to safely parse the date value (string or Date object)
const getDateObject = (dateValue: Value): Date | null => {
    // If it's already a valid Date object
    if (dateValue instanceof Date && isDateValid(dateValue)) {
        return dateValue;
    }

    // If it's a string in the expected Spanish format
    if (typeof dateValue === 'string') {
        try {
            // Define the format matching 'viernes, 4 de abril de 2025'
            // EEEE = Full day name, d = day number, MMMM = Full month name, yyyy = year
            const formatString = "EEEE, d 'de' MMMM 'de' yyyy";
            const parsedDate = parse(dateValue, formatString, new Date(), { locale: es });

            if (isDateValid(parsedDate)) {
                return parsedDate;
            }
        } catch (error) {
            console.error("Error parsing date string:", dateValue, error);
            return null; // Indicate parsing failure
        }
    }

    // Handle array format if necessary (using start date)
    if (Array.isArray(dateValue) && dateValue[0] instanceof Date && isDateValid(dateValue[0])) {
        return dateValue[0];
    }

    // Return null for other invalid types or null/undefined
    return null;
};


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
            const dateA = getDateObject(a.date);
            const dateB = getDateObject(b.date);

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