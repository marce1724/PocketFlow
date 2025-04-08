import React, { useContext, useMemo } from 'react';
// Remove Chart.js imports
// import { Bar } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartOptions, ChartData, TooltipItem } from 'chart.js';
// import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import 'tailwindcss/tailwind.css';

// Import Tremor components
import { Card, BarList, } from '@tremor/react'; // Added Card, Title, BarList, Flex, Text

import { BudgetContext } from '../context/BudgetContext';

// Remove ChartJS registration
// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const BudgetTracker = () => {
  const { state } = useContext(BudgetContext);
  const { CategoryBudgets } = state;

  // --- Calculate Total Remaining Budget (remains the same) ---
  const totalRemaining = useMemo(() => {
    return CategoryBudgets.reduce((sum, budget) => {
        const remainingValue = typeof budget.value === 'number' ? budget.value : 0;
        return sum + remainingValue;
    }, 0);
  }, [CategoryBudgets]);

  // --- Color generation logic is NOT needed for BarList ---
  // Remove getRandomColorsWithRules function

  // --- Chart data is NOT needed in Chart.js format ---
  // Remove chartData constant

   // --- Function to format currency (KEEP this) ---
   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // --- Chart options are NOT needed for BarList ---
  // Remove chartOptions constant

  // --- Prepare data specifically for BarList ---
  // BarList expects data in the format { name: string, value: number }
  // Your CategoryBudgets already matches this structure!
  // Optional: Filter out categories with 0 or negative remaining budget if desired
  const barListData = useMemo(() => {
      return CategoryBudgets
          // .filter(budget => budget.value > 0) // Uncomment to hide empty/negative categories
          .map(budget => ({
              name: budget.name.charAt(0).toUpperCase() + budget.name.slice(1), // Capitalize name
              value: typeof budget.value === 'number' ? budget.value : 0,
              // Optional: Add icon if available in your CategoryBudgets type
              // icon: () => <SomeIconComponent name={budget.icon} />
          }))
          // Optional: Sort data for BarList if needed (e.g., highest value first)
          .sort((a, b) => b.value - a.value);
  }, [CategoryBudgets]);


  return (

    <div className="relative flex flex-col md:block "> 

      {/* Top-Right Total Remaining (Keep as is) */}
      <div className="hidden md:block md:absolute md:top-1 md:right-1 lg:top-2 lg:right-2 text-right z-10">
        <p className="text-sm font-semibold text-gray-500">Total Remaining</p>
        <p className="text-sm font-bold text-sky-700">
          {formatCurrency(totalRemaining)}
        </p>
      </div>

      <div className="text-left mb-4 md:mb-4 shrink-0 md:pr-24 lg:pr-28"> {/* Adjusted margin */}
        <h1 className="text-sky-700 text-xl md:text-2xl font-bold tracking-wider">
          Budget Tracker
        </h1>
        <p className="text-sm font-semibold text-sky-700 mt-2 md:hidden">
            <span className=' text-sm text-gray-500'>Total Remaining:</span> {formatCurrency(totalRemaining)}
        </p>
      </div>

      <div className="relative flex-grow md:flex-grow-0 w-full p-4">

            <BarList
                data={barListData} // Use the prepared data
                valueFormatter={formatCurrency} // Use your currency formatter
                className="mt-4" // Add some margin top
                // Optional: Change color of the bars
                //color="emerald"
            /> 
      </div>

    </div>
  );
};

export default BudgetTracker;