

import { budgetState } from "../reducers/budget-reducer";

// Función actualizada para formatear como Euros (€)
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', { // Locale cambiado (ej: Alemania)
        style: 'currency',
        currency: 'EUR' // Código de moneda cambiado a EUR
    }).format(amount);
}

// Tu función formatDate (sin cambios, ya usa 'es-ES')
export function formatDate(dateStr: string): string {
    const dateObj = new Date(dateStr);

    // Check if the date object is valid after parsing
    if (isNaN(dateObj.getTime())) {
        console.error("Invalid date string passed to formatDate:", dateStr);
        return "Invalid Date"; // Return an indicator for invalid dates
    }

    // Define options for "DD Month" format
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit', // e.g., 07, 15
        month: 'long',  // e.g., April, October
        // No weekday or year needed
    };

    // Use an English locale like 'en-GB' or 'en-US'
    // 'en-GB' often defaults to DD/MM order which feels natural for DD Month
    return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
    // You could also use 'en-US', the output for these specific options is usually the same.
}



export async function loadFromJSON(): Promise<budgetState> {
    try {
        const response = await fetch("http://localhost:5000/api/data");
        if (response.ok) {
            const data = await response.json();
            return {
                budget: data.budget || 0,
                CategoryBudgets: data.CategoryBudgets || [],
                expenses: data.expenses || [],
                modal: false,
                editingId: "",
                currentCategory: "",
            };
        }
        throw new Error("Failed to fetch data");
    } catch (error) {
        console.error("Error al cargar los datos desde el backend:", error);
        return {
            budget: 0,
            CategoryBudgets: [],
            expenses: [],
            modal: false,
            editingId: "",
            currentCategory: "",
        };
    }
}

export async function saveToJSON(data: object): Promise<void> {
    try {
        await fetch('http://localhost:5000/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error('Error al guardar los datos:', error);
    }
}
