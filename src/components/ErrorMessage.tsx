
import { PropsWithChildren } from "react"

export default function ErrorMessage({ children }: PropsWithChildren) {
  return (
      <div className="p-2 border border-red-600 bg-red-100 rounded-md">
          <p className="text-red-400 font-bold text-sm text-center">
              {children}
          </p>
      </div>
  );
}
