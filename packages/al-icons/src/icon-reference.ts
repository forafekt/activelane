export type IconReference = `${string}:${string}` | `${string}.${string}`

// Removed unnecessary escape on the dot inside the character class [\.:] -> [.:]
const referencePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*[.:][a-z0-9]+(?:-[a-z0-9]+)*$/

export function isIconReference(value: string): value is IconReference {
  return referencePattern.test(value)
}

export function normalizeIconReference(reference: IconReference): `${string}:${string}` {
  if (!isIconReference(reference)) {
    throw new TypeError(
      `Invalid icon reference "${reference}". Expected "namespace.icon" or "namespace:icon".`,
    )
  }

  // Split on either character using a simple RegExp.
  // Because isIconReference passed, we are guaranteed exactly two elements.
  const [namespace, icon] = reference.split(/[.:]/) as [string, string]

  return `${namespace}:${icon}`
}

export function denormalizeIconReference(reference: `${string}:${string}`): IconReference {
  const [namespace, icon] = reference.split(':') as [string, string]
  return `${namespace}.${icon}`
}
