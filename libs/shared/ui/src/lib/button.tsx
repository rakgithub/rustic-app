import type { ComponentProps } from "react";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  const classNames = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  return <button className={classNames} type={type} {...props} />;
}
