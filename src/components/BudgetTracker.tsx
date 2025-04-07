import React, { useContext, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipItem
} from 'chart.js';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import 'tailwindcss/tailwind.css';

import { BudgetContext } from '../context/BudgetContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

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

  // --- Color generation logic (remains the same) ---
  const skyBluePalette: string[] = [
    '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc' , '#a7e6ff', '#8ecde6'
  ];
  const getRandomColorsWithRules = (palette: string[], length: number): string[] => {
    // ... (color generation code remains the same) ...
    const colors: string[] = [];
    const colorCount: Record<string, number> = {};
    if (length <= 0) return [];
    for (let i = 0; i < length; i++) {
      let randomColor: string;
      if (colors.length >= palette.length * 2 && length > palette.length * 2) {
          console.warn("Cannot generate unique colors based on rules and palette size.");
          colors.push(palette[i % palette.length]);
          continue;
      }
      do {
        if (palette.length === 0) {
            console.error("Color palette is empty.");
            return [];
        }
        randomColor = palette[Math.floor(Math.random() * palette.length)];
      } while (
        (colors.length > 0 && colors[colors.length - 1] === randomColor) ||
        (colorCount[randomColor] >= 2)
      );
      colors.push(randomColor);
      colorCount[randomColor] = (colorCount[randomColor] || 0) + 1;
    }
    return colors;
  };

  // --- Chart data (remains the same) ---
  const chartData: ChartData<'bar'> = {
    labels: CategoryBudgets.map((budget) => budget.name),
    datasets: [
      {
        data: CategoryBudgets.map((budget) => typeof budget.value === 'number' ? budget.value : 0),
        backgroundColor: getRandomColorsWithRules(skyBluePalette, CategoryBudgets.length),
        barPercentage: 0.7,
      },
    ],
  };

   // --- Function to format currency (remains the same) ---
   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // --- Chart options for VERTICAL bars ---
  // --- Chart options with X-axis labels capitalized & unused param warnings disabled ---
  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 4,
        color: '#4A5568',
        font: { size: 10, weight: 'bold' },
        formatter: (value: number) => `€${value.toFixed(2)}`,
        clip: false,
      },
      tooltip: {
          callbacks: {
              label: function(context: TooltipItem<'bar'>) {
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed.y !== null) {
                     // Ensure formatCurrency is defined in the component scope
                     label += formatCurrency(context.parsed.y);
                  }
                  return label;
              }
          }
      }
    },
    layout: {
      padding: { top: 30, left: 10, right: 10, bottom: 30 },
    },
    scales: {
      // X-axis (Categories - BOTTOM LABELS)
      x: {
        border: { display: false },
        ticks: {
          display: true,
          autoSkip: false,
          color: '#334155',
          padding: 5,
          font: { size: 10 },
          // *** ADDED ESLint disable comment ***
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          callback: function(value, index, ticks) { // Keep original params
              // We still only use 'value' here
              const label = this.getLabelForValue(value as number);
              if (typeof label === 'string') {
                  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
              }
              return label;
          },
          // maxRotation: 45,
          // minRotation: 45,
        },
        grid: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore -- Keep ignore for drawBorder if needed
            drawBorder: false
        },
      },
      // Y-axis (Values)
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
           display: true,
           padding: 10,
           font: { size: 10 },
           maxTicksLimit: 6,
        },
        grid: {
           // eslint-disable-next-line @typescript-eslint/ban-ts-comment
           // @ts-ignore -- Keep ignore for drawBorder if needed
           drawBorder: false,
           color: '#e2e8f0'
        },
      },
    },
  };


  return (
    // Keep responsive layout structure
    <div className="h-[300px] md:h-[350px] relative flex flex-col md:block overflow-hidden">

      {/* Top-Right Total Remaining */}
      <div className="hidden md:block md:absolute md:top-1 md:right-1 lg:top-2 lg:right-2 text-right z-10">
        <p className="text-sm font-semibold text-gray-600">Total Remaining</p> {/* Adjusted size back */}
        <p className="text-sm font-bold text-sky-700"> {/* Adjusted size back */}
          {formatCurrency(totalRemaining)}
        </p>
      </div>

      {/* Wrapper for Title and MOBILE Total Remaining */}
      <div className="text-left mb-2 md:mb-0 shrink-0 md:pr-24 lg:pr-28">
        <h1 className="text-sky-700 text-xl md:text-2xl font-bold tracking-wider">
          Budget Tracker
        </h1>
        {/* Adjusted mobile total text size and margin */}
        <p className="text-sm font-semibold text-sky-700 mt-2 md:hidden"> {/* Adjusted size and color slightly */}
            <span className=' text-sm text-gray-500'>Total Remaining:</span> {formatCurrency(totalRemaining)}
        </p>
      </div>

      {/* Chart container */}
      <div className="relative flex-grow min-h-0 md:flex-grow-0 h-full w-full pt-0 md:pt-4">
         <Bar key={CategoryBudgets.length} data={chartData} options={chartOptions} />
      </div>

    </div>
  );
};

export default BudgetTracker;