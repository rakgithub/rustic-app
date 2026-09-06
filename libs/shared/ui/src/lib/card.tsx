import type { ComponentProps } from "react";

import styles from "./card.module.css";

export type CardProps = ComponentProps<"section">;

export function Card({ className, ...props }: CardProps) {
  const classNames = [styles.card, className].filter(Boolean).join(" ");

  return <section className={classNames} {...props} />;
}
