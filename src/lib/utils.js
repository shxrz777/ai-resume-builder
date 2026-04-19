import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  if (dateStr.toLowerCase() === 'present') return 'Present'
  return dateStr
}
