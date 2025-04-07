
import { useMemo } from "react"
import { Expense } from "../types"
import { formatDate } from "../helpers"
import { categories } from "../data/categories"
import AmountDisplay from "./AmountDisplay"
import { useBudget } from "../hooks/useBudget"
import {
    LeadingActions,
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';


type ExpenseDetailsProps = {
    expense: Expense
}


export default function ExpenseDetail({ expense }: ExpenseDetailsProps) {

    const { dispatch } = useBudget()

    const categoryInfo = useMemo(() => categories.filter(cat => cat.id === expense.category)[0], [expense])

    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction
                onClick={() => dispatch({ type: 'get-expense-by-id', payload: {id: expense.id}})}
            >
                Update
            </SwipeAction>

        </LeadingActions>
    )


    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                onClick={() => dispatch({ type:'remove-expense', payload: {id: expense.id}})}
                destructive={true}
            >
                Delete
            </SwipeAction>

        </TrailingActions>
    )

    return (
        <SwipeableList>
            <SwipeableListItem
                maxSwipe={1}
                leadingActions={leadingActions()}
                trailingActions={trailingActions()}
            >
                <div className=" bg-white shadow-lg p-4 w-full border-b border-gray-200 flex gap-5 items-center ">
                    <div>
                        <img
                            src={`/icono_${categoryInfo.icon}.svg`}
                            alt="expense icon"
                            className=" w-14"

                        />
                    </div>

                    <div className=" flex-1 space-y-2">
                        <p className=" text-xs font-bold uppercase text-slate-500">{categoryInfo.name}</p>
                        <p className=" text-sm text-slate-800">{expense.expenseName}</p>
                        <p className=" text-slate-600 text-xs">{formatDate(expense.date!.toString())}</p>
                    </div>

                    <AmountDisplay
                        amount={expense.amount}
                    />
                </div>
            </SwipeableListItem>
        </SwipeableList>
    )
}
