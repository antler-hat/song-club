import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          "textarea",
          className
        )}
        ref={ref}
        rows={rows}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
