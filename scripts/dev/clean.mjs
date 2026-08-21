import fs from 'node:fs'

// Patterns to search for and destroy
const targets = ['**/node_modules', '**/dist', '**/pnpm-lock.yaml']

console.log('🧹 Clearing build artifacts and locks...')

// Find all matching paths and delete them recursively
targets
  .flatMap((pattern) => fs.globSync(pattern))
  .forEach((path) => {
    try {
      fs.rmSync(path, { recursive: true, force: true })
      console.log(`  🗑️ Removed: ${path}`)
    } catch (err) {
      console.error(`  ❌ Failed to remove ${path}:`, err.message)
    }
  })

console.log('✨ Cleanup complete!')
