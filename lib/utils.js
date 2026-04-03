import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0.00%";
  return `${num.toFixed(2)}%`;
}
