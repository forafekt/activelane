export type WorkbenchContextValue = boolean | number | string | null | undefined

export interface WorkbenchContextExpressionScope {
  [key: string]: WorkbenchContextValue
}

function stripQuotes(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function readValue(raw: string): WorkbenchContextValue {
  const value = stripQuotes(raw)
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  return value
}

function evaluateTerm(term: string, scope: WorkbenchContextExpressionScope): boolean {
  const trimmed = term.trim()
  if (!trimmed || trimmed === '*') return true
  if (trimmed.startsWith('!')) return !evaluateTerm(trimmed.slice(1), scope)

  const equality = trimmed.match(/^([A-Za-z0-9_.:-]+)\s*(==|!=|===|!==)\s*(.+)$/)
  if (equality) {
    const [, key, operator, rawValue] = equality
    const actual = scope[key ?? '']
    const expected = readValue(rawValue ?? '')
    const matches = actual === expected
    return operator === '==' || operator === '===' ? matches : !matches
  }

  return Boolean(scope[trimmed])
}

function evaluateAnd(expression: string, scope: WorkbenchContextExpressionScope): boolean {
  return expression.split(/\s+&&\s+/).every((term) => evaluateTerm(term, scope))
}

export function evaluateWorkbenchContextExpression(
  expression: string | undefined,
  scope: WorkbenchContextExpressionScope,
): boolean {
  if (!expression || expression.trim() === '*') return true
  return expression.split(/\s+\|\|\s+/).some((part) => evaluateAnd(part, scope))
}
