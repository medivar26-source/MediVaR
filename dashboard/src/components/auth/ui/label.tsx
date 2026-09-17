"use client"

import * as React from "react"
import styles from "./label.module.css"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={`${styles.label} ${className || ""}`.trim()}
      {...props}
    />
  )
}

export { Label }
