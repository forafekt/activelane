import type { WorkbenchApplicationContribution } from '../../core/workbench/contributions'

import type { LauncherSearchResult } from '../types'

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function scoreField(field: string | undefined, query: string, weight: number) {
  if (!field) return 0
  const value = normalize(field)
  if (!value) return 0
  if (value === query) return weight + 60
  if (value.startsWith(query)) return weight + 36
  if (value.includes(query)) return weight + 18

  let cursor = 0
  let streak = 0
  let score = 0
  for (const char of query) {
    const index = value.indexOf(char, cursor)
    if (index < 0) return 0
    streak = index === cursor ? streak + 1 : 0
    score += 2 + streak
    cursor = index + 1
  }
  return Math.max(1, Math.round(score * (weight / 20)))
}

export function searchLauncherApps(
  apps: WorkbenchApplicationContribution[],
  query: string,
): LauncherSearchResult[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) {
    return apps.map((app, index) => ({ app, score: apps.length - index, matches: [] }))
  }

  return apps
    .map((app) => {
      const fields = [
        { key: 'name', value: app.name, weight: 80 },
        { key: 'title', value: app.title, weight: 60 },
        { key: 'category', value: app.category, weight: 42 },
        { key: 'description', value: app.description, weight: 30 },
        { key: 'extension', value: app.ownerExtensionId, weight: 26 },
        ...(app.keywords ?? []).map((value) => ({ key: 'keyword', value, weight: 46 })),
      ]
      const scored = fields
        .map((field) => ({
          key: field.key,
          score: scoreField(field.value, normalizedQuery, field.weight),
        }))
        .filter((field) => field.score > 0)
      const score = scored.reduce((total, field) => total + field.score, 0)
      return { app, score, matches: scored.map((field) => field.key) }
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.app.name.localeCompare(right.app.name))
}
