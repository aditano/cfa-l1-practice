export function pct(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function num(value: number, digits = 2): string {
  return value.toFixed(digits)
}

export function usd(value: number, digits = 2): string {
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function shares(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function inline(expr: string): string {
  return `\\(${expr}\\)`
}

export function block(expr: string): string {
  return `\\[${expr}\\]`
}
