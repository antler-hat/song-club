import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import './chip.scss';
import { cn } from "@/lib/utils"

const chipVariants = cva(
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
    text: string;
}

function Chip({ className, variant, text, ...props }: ChipProps) {
  return (
    <div className={cn(chipVariants({ variant }), className, "chip")} {...props}>
      {text}
    </div>
  )
}

export { Chip, chipVariants }
