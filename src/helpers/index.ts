

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
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    // Ya está usando 'es-ES', lo cual es correcto para el formato de fecha en español
    return new Intl.DateTimeFormat('es-ES', options).format(dateObj);
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
