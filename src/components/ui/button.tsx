import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        // CTA principal — Vert Savane
        default:
          "bg-savane text-ivoire hover:bg-savane-hover rounded-xl",
        // Secondaire — Sable Chaud
        secondary:
          "bg-sable text-charbon hover:bg-bordure-forte rounded-lg",
        // Surface blanche
        white:
          "bg-white text-noir hover:bg-ivoire border border-bordure rounded-xl",
        // Sombre charbon
        dark:
          "bg-noir-eleve text-ivoire hover:bg-noir rounded-lg",
        // Sombre principal (cartes dark)
        "dark-primary":
          "bg-noir text-argent hover:bg-noir-eleve border border-bordure-forte rounded-xl",
        // Destructif
        destructive:
          "bg-error text-ivoire hover:bg-error/90 rounded-lg",
        // Ghost
        ghost:
          "text-olive hover:bg-sable hover:text-charbon rounded-lg",
        // Lien
        link:
          "text-savane underline-offset-4 hover:underline p-0 h-auto",
        // Outline
        outline:
          "border border-bordure-forte bg-transparent text-charbon hover:bg-sable rounded-lg",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-base",
        sm:      "h-9 px-4 text-sm rounded-lg",
        lg:      "h-13 px-6 text-base",
        xl:      "h-14 px-8 text-base",
        icon:    "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
