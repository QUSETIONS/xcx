export const DEFAULT_COOPERATION_STATUS = 'open'

export function filterCooperationEntries(entries, { status = DEFAULT_COOPERATION_STATUS, category = 'all' } = {}) {
  const source = Array.isArray(entries) ? entries : []
  return source.filter((entry) => (
    (status === 'all' || entry.status === status)
    && (category === 'all' || entry.category_id === category)
  ))
}

export function groupCooperationEntries(categories, entries) {
  const categoryList = Array.isArray(categories) ? categories : []
  return categoryList
    .map((category) => ({ ...category, items: entries.filter((entry) => entry.category_id === category.id) }))
    .filter((category) => category.items.length)
}
