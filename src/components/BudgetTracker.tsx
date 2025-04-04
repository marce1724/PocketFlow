import React, { useContext, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions, // Import ChartOptions for typing
  ChartData,    // Import ChartData for typing
  TooltipItem   // Import TooltipItem for context typing
} from 'chart.js';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'; // Import Context for formatter typing
import 'tailwindcss/tailwind.css';

// Assuming you use a Context named BudgetContext
import { BudgetContext } from '../context/BudgetContext'; // Adjust path if needed

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const BudgetTracker = () => {
  // Access the full state from the Context
  const { state } = useContext(BudgetContext);
  // Destructure needed parts
  const { CategoryBudgets } = state;

  // --- Calculate Total Remaining Budget ---
  const totalRemaining = useMemo(() => {
    return CategoryBudgets.reduce((sum, budget) => {
        const remainingValue = typeof budget.value === 'number' ? budget.value : 0;
        return sum + remainingValue;
    }, 0);
  }, [CategoryBudgets]);

  // --- Color generation logic with explicit types ---
  const skyBluePalette: string[] = [ // Type the palette array
    '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe',
  ];

  // Add types for parameters and return type
  const getRandomColorsWithRules = (palette: string[], length: number): string[] => {
    const colors: string[] = [];
    // Explicitly type colorCount
    const colorCount: Record<string, number> = {};

    if (length <= 0) return [];

    for (let i = 0; i < length; i++) {
      let randomColor: string;

      // Basic check to prevent infinite loop if length > palette size * 2
      if (colors.length >= palette.length * 2 && length > palette.length * 2) {
          console.warn("Cannot generate unique colors based on rules and palette size.");
          // Fallback: just repeat the palette
          colors.push(palette[i % palette.length]);
          continue;
      }

      do {
        // Ensure palette is not empty
        if (palette.length === 0) {
            console.error("Color palette is empty.");
            return []; // Or throw an error
        }
        randomColor = palette[Math.floor(Math.random() * palette.length)];
      } while (
        (colors.length > 0 && colors[colors.length - 1] === randomColor) || // No consecutive
        (colorCount[randomColor] >= 2) // No more than 2 rep
      );

      colors.push(randomColor);
      colorCount[randomColor] = (colorCount[randomColor] || 0) + 1;
    }
    return colors;
  };

  // --- Chart data with explicit type ---
  const chartData: ChartData<'bar'> = { // Use ChartData type
    labels: CategoryBudgets.map((budget) => budget.name),
    datasets: [
      {
        // label: 'Remaining Budget', // Optional: Add a label
        data: CategoryBudgets.map((budget) => typeof budget.value === 'number' ? budget.value : 0), // Ensure data is numbers
        backgroundColor: getRandomColorsWithRules(skyBluePalette, CategoryBudgets.length),
      },
    ],
  };

  // --- Chart options with explicit type and corrected/ignored properties ---
  const chartOptions: ChartOptions<'bar'> = { // Use ChartOptions type
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        // Use 'as const' for specific literal string types expected by the library
        anchor: 'end' as const,
        align: 'end' as const,
        // Add type for value in formatter
        formatter: (value: number, context: Context) => `€${value.toFixed(2)}`,
        color: '#4A5568',
        font: {
          size: 12,
        },
        clip: false,
      },
      tooltip: {
          callbacks: {
              // Add type for context in tooltip callback
              label: function(context: TooltipItem<'bar'>) {
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  // Use context.parsed.x for horizontal bar chart values
                  if (context.parsed.x !== null) {
                     label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.x);
                  }
                  return label;
              }
          }
      }
    },
    layout: {
      padding: { // Keep existing layout padding
        top: 20,
        left: 10,
        right: 10, // Keep original right padding
      },
    },
    scales: {
      x: {
        beginAtZero: true, // Ensure axis starts at 0
        ticks: {
          padding: 40, // Keep original padding
        },
        grid: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore -- Hiding error for deprecated 'drawBorder' as requested
          drawBorder: false, // Keep original line causing the error
        },
      },
      y: {
        ticks: {
          padding: 10, // Keep original padding
        },
        grid: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore -- Hiding error for deprecated 'drawBorder' as requested
          drawBorder: false, // Keep original line causing the error
        },
      },
    },
  };

  // --- Function to format currency (remains the same) ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { // Example locale for Euro formatting
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    // Add `relative` positioning to the main container, keep existing height
    <div className="h-[350px] relative"> {/* Added relative */}

      {/* Absolute positioned element for Total Remaining Budget */}
      <div className="absolute top-2 right-2 text-right z-10">
        <p className="text-sm font-semibold text-gray-500">Total Remaining</p>
        <p className="text-sm font-bold text-sky-700">
          {formatCurrency(totalRemaining)}
        </p>
      </div>

      {/* Existing Title */}
      {/* Keep original padding */}
      <h1 className="text-gray-500 text-2xl font-bold tracking-wider pr-24">
        Budget Tracker
      </h1>

      {/* Chart - Pass explicitly typed data and options */}
      {/* Add a key that changes when data length changes to force re-render if needed */}
      <Bar key={CategoryBudgets.length} data={chartData} options={chartOptions} />
    </div>
  );
};

export default BudgetTracker;