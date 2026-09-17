import { Button as ButtonPrimitive } from "@base-ui/react/button"
import styles from "./button.module.css"

function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  ...props
}: ButtonPrimitive.Props & {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  loading?: boolean;
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={[
        styles.button,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className
      ].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export { Button }
