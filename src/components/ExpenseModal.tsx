// ExpenseModal.tsx (Verify this version)
import { Fragment } from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Dialog, Transition } from '@headlessui/react'
import { useBudget } from '../hooks/useBudget'
import ExpenseForm from './ExpenseForm'

export default function ExpenseModal() {

    const { state, dispatch } = useBudget()

    return (
        <>
            {/* Floating Action Button (Ensure focus styles are correct) */}
            <div className="fixed right-5 bottom-5 flex items-center justify-center z-20">
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'show-modal' })}
                    className="rounded-full" // Kept focus styles
                >
                    <PlusCircleIcon className='w-16 h-16 text-blue-600 rounded-full ' />
                </button>
            </div>

            {/* Headless UI Dialog */}
            <Transition appear show={state.modal} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => { }}>


                    {/* Overlay */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-75" />
                    </Transition.Child>

                    {/* Modal Container - IMPORTANT: overflow-y-auto allows page scroll */}
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            {/* Modal Panel Transition */}
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                {/* === The Modal Panel Itself === */}
                                <Dialog.Panel
                                  // Ensure overflow-hidden is REMOVED. Keep desired width/padding.
                                  className="relative w-full max-w-3xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                                  // NO overflow-hidden HERE ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                >
                                    <button
                                        onClick={() => dispatch({ type: 'close-modal' })}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        aria-label="Close"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    {/* The ExpenseForm is rendered inside */}
                                    <ExpenseForm />

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}