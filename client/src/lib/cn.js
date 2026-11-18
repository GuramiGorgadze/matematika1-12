import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** merge class names; later Tailwind utilities win over earlier conflicting ones */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
