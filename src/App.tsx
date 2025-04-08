import React, { useState, useMemo, useEffect, useRef } from "react";
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import BudgetForm from "./components/BudgetForm";
import BudgetTracker from "./components/BudgetTracker";
import ExpenseModal from "./components/ExpenseModal";
import ExpenseList from "./components/ExpenseList";
import { useBudget } from "./hooks/useBudget";
import FilterByCategory from "./components/FilterByCategory";

function App() {
  const { state, dispatch } = useBudget();
  const isValidBudget = useMemo(() => state.budget > 0, [state.budget]);

  // --- State for UI elements ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false); // <-- Add state for update mode
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Save state to localStorage --- (no change)
  useEffect(() => {
    localStorage.setItem('budgetState', JSON.stringify(state));
  }, [state]);

  // --- Handle clicking outside the dropdown --- (no change)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // --- Event Handlers ---
  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenConfirmModal = () => {
    setIsDropdownOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleResetApp = () => {
    dispatch({ type: "reset-app" });
    setIsConfirmModalOpen(false);
    setIsUpdatingBudget(false); // Ensure update mode is also reset
  };

  // Updated handler for "Update Budget"
  const handleUpdateBudget = () => {
    setIsUpdatingBudget(true); // <-- Set update mode to true
    setIsDropdownOpen(false); // Close dropdown
  };

  // Callback function for BudgetForm completion
  const handleBudgetSet = () => {
    setIsUpdatingBudget(false); // <-- Turn off update mode when form is submitted
  };


  return (
    <>
      {/* ================== HEADER START ================== */}
      <header className="bg-blue-600 py-8 max-h-72 relative">
         {/* ... (header content remains the same) ... */}
         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
           <div className="flex-grow text-center">
             <h1 className="uppercase font-black text-4xl text-white inline-block">
               Budget Planner
             </h1>
           </div>
         </div>
         {isValidBudget && (
           <div
             className="absolute top-0 right-4 sm:right-6 lg:right-8 h-full flex items-center z-10"
             ref={dropdownRef}
           >
             <div className="relative">
               <button
                 onClick={handleToggleDropdown}
                 className="p-2 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white"
                 aria-label="Settings"
               >
                 <Cog6ToothIcon className="h-6 w-6" />
               </button>
               {isDropdownOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                   <button
                     onClick={handleUpdateBudget} // <-- Calls the updated handler
                     className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                   >
                     Update Budget
                   </button>
                   <button
                     onClick={handleOpenConfirmModal}
                     className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                   >
                     Reset App
                   </button>
                 </div>
               )}
             </div>
           </div>
         )}
      </header>
      {/* ================== HEADER END ================== */}


      {/* ================== MAIN CONTENT AREA ================== */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg mt-10 p-10">
        {/* Show BudgetForm if updating OR if budget is not valid yet */}
        {isUpdatingBudget || !isValidBudget ? (
          <BudgetForm
            onBudgetSet={handleBudgetSet} // Pass the callback
            // Pass current state values ONLY if updating (isValidBudget is true)
            // Otherwise, pass undefined to let BudgetForm use defaults
            currentBudget={isValidBudget ? state.budget : undefined}
            currentCategoryBudgets={isValidBudget ? state.CategoryBudgets : undefined}
          />
        ) : (
          // Otherwise, show the tracker
          <BudgetTracker />
        )}
      </div>

      {/* Show expenses section only if budget is valid AND we are NOT updating */}
      {isValidBudget && !isUpdatingBudget && (
        <main className="max-w-3xl mx-auto py-10">
          <FilterByCategory />
          <ExpenseList />
          <ExpenseModal />

        </main>
      )}
      {/* ================== END MAIN CONTENT AREA ================== */}


      {/* --- Confirmation Modal --- (no change) */}
      {isConfirmModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 transition-opacity duration-300 ease-out">
           {/* ... modal content ... */}
           <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all duration-300 ease-out scale-100">
             <div className="flex items-start space-x-3">
               <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                 <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
               </div>
               <div className="mt-0 text-left">
                 <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                   Reset Application
                 </h3>
                 <div className="mt-2">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to reset the application? All budget data and expenses will be permanently deleted.
                   </p>
                 </div>
               </div>
             </div>
             <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
               <button
                 type="button"
                 className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                 onClick={handleResetApp}
               >
                 Yes, Reset
               </button>
               <button
                 type="button"
                 className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                 onClick={handleCloseConfirmModal}
               >
                 No, Cancel
               </button>
             </div>
           </div>
         </div>
      )}
      {/* --- End Confirmation Modal --- */}
    </>
  );
}

export default App;