import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Capitalises the first letter of every word, leaving the rest as typed
export function capitalizeWords(value: string) {
  return value.replace(/(^|\s)([a-z])/g, (_, before, letter) => before + letter.toUpperCase())
}

// Capitalises the first letter of every sentence and line, leaving the rest as typed
export function capitalizeSentences(value: string) {
  return value.replace(/(^\s*|[.!?]\s+|\n\s*)([a-z])/g, (_, before, letter) => before + letter.toUpperCase())
}

// Capitalises a text field's value in place (keeping the caret put) and returns it
export function capitalizeInput(
  e: { target: HTMLInputElement | HTMLTextAreaElement },
  capitalize: (value: string) => string = capitalizeWords
) {
  const field = e.target
  const next = capitalize(field.value)
  if (next !== field.value) {
    const { selectionStart, selectionEnd } = field
    field.value = next
    field.setSelectionRange(selectionStart, selectionEnd)
  }
  return next
}
