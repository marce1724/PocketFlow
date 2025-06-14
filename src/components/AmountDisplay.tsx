
import { formatCurrency } from "../helpers"

type AmountDisplayProps = {
    amount: number
}

export default function AmountDisplay({amount}: AmountDisplayProps) {
  
  return (
    <p className=" text-md text-blue-600 font-bold">
        <span className=" font-black text-gray-600">
            { formatCurrency(amount) }
        </span>
    </p>
  )
}
