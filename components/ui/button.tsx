import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva("button", {
  variants: {
    variant: {
      default: "",
      primary: "primary",
      danger: "danger",
      link: "text-button",
    },
  },
  defaultVariants: { variant: "default" },
})

/** Render the existing shadcn/Base UI button using option B's exact CSS classes. */
function Button({
  className,
  variant,
  type = "button",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
