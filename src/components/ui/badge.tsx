import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        // Marque VitrinAI
        brand:        "bg-[#e8f5ee] text-savane",
        // Plan / grade A
        success:      "bg-[#dcfce7] text-[#166534]",
        // Grade B / en cours
        info:         "bg-[#dbeafe] text-[#1e40af]",
        // Grade C / avertissement
        warning:      "bg-[#fef3c7] text-[#92400e]",
        // Grade D-F / erreur
        error:        "bg-[#fee2e2] text-[#991b1b]",
        // Neutre / en attente
        muted:        "bg-sable text-pierre",
        // Pipeline CRM
        "crm-nouveau":    "bg-[#f3f4f6] text-pierre",
        "crm-contacté":   "bg-[#dbeafe] text-[#1e40af]",
        "crm-répondu":    "bg-[#fef3c7] text-[#92400e]",
        "crm-rdv":        "bg-[#ede9fe] text-[#5b21b6]",
        "crm-converti":   "bg-[#dcfce7] text-[#166534]",
        "crm-refusé":     "bg-[#fee2e2] text-[#991b1b]",
        // Plan tarifaire
        plan:         "bg-savane text-ivoire",
        // Outline
        outline:      "border border-bordure-forte text-charbon bg-transparent",
      },
    },
    defaultVariants: {
      variant: "brand",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
