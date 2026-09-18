import * as React from "react"

import { capitalizeInput, cn } from "@/lib/utils"

// Plain text fields capitalise each word as you type; pass autoCapitalize="off"
// (search boxes, links, codes) to keep the value exactly as typed
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoCapitalize, onChange, ...props }, ref) => {
    const capitalize = (!type || type === "text") && autoCapitalize !== "off" && autoCapitalize !== "none"
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        autoCapitalize={capitalize ? "words" : autoCapitalize}
        onChange={capitalize ? (e) => { capitalizeInput(e); onChange?.(e) } : onChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
