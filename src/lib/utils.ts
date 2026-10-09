import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function toArray(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export function isSafeHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.hostname.endsWith('.local') && url.hostname !== 'localhost'
  } catch {
    return false
  }
}
