// Representa un presupuesto individual
export type CategoryBudgets = {
    id: string;        // Identificador único
    name: string;      // Nombre de la categoría
    icon?: string;     // (Opcional) Ícono asociado a la categoría
    value: number;     // Valor definido por el usuario
};

// Budgets ahora es un array de CategoryBudgets
export type Budgets = CategoryBudgets[];

// Representa un gasto individual
export type Expense = {
    id: string;         // Identificador único para el gasto
    expenseName: string;// Nombre descriptivo del gasto
    amount: number;     // Cantidad gastada
    category: string;   // ID del CategoryBudgets relacionado
    date: Date;        // Fecha 1 gasto
};

// Versión preliminar de Expense sin ID
export type DraftExpense = Omit<Expense, 'id'>;

// Categorías opcionales para UI
export type Category = {
    id: string;         // ID que debe coincidir con un CategoryBudget ID
    name: string;       // Nombre descriptivo de la categoría
    icon: string;       // Ícono asociado a la categoría
};


export type SaveData = {
    budget: number;
    CategoryBudgets: {
        id: string;
        name: string;
        value: number;
        icon?: string;
    }[];
};
