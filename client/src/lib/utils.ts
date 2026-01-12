import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKRW(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "0";
  const num = typeof amount === "string" ? parseInt(amount.replace(/,/g, ""), 10) : amount;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(num);
}
