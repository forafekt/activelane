export type IconReference = `${string}.${string}`

const referencePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isIconReference(value: string): value is IconReference {
  return referencePattern.test(value)
}

export function normalizeIconReference(reference: IconReference): `${string}:${string}` {
  if (!isIconReference(reference)) {
    throw new TypeError(`Invalid icon reference "${reference}". Expected "namespace.icon".`)
  }

  const separator = reference.indexOf('.')
  return `${reference.slice(0, separator)}:${reference.slice(separator + 1)}`
}
