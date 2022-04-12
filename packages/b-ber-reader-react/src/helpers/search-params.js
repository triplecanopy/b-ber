// Test if params are valid
export const hasSearchParams = (stringOrMap, searchParamKeys) => {
  if (!stringOrMap) return false

  const params =
    stringOrMap instanceof URLSearchParams
      ? stringOrMap
      : new URLSearchParams(stringOrMap)

  const {
    currentSpineItemIndex: currentSpineItemIndexKey,
    spreadIndex: spreadIndexKey,
  } = searchParamKeys

  let valid = true

  if (!params.has(currentSpineItemIndexKey) || !params.has(spreadIndexKey)) {
    valid = false
  }

  return valid
}

// Remove all non-bber params
export const stripSearchParams = (stringOrMap, searchParamKeys) => {
  const params =
    stringOrMap instanceof URLSearchParams
      ? stringOrMap
      : new URLSearchParams(stringOrMap)

  const {
    currentSpineItemIndex: currentSpineItemIndexKey,
    spreadIndex: spreadIndexKey,
    slug: slugKey,
  } = searchParamKeys

  const allowed = new Set([currentSpineItemIndexKey, spreadIndexKey, slugKey])

  params.forEach((_val, key) => {
    if (!allowed.has(key)) params.delete(key)
  })

  return params
}

// Ensure required values are set
export const ensureSearchParams = (stringOrMap, searchParamKeys) => {
  const params =
    stringOrMap instanceof URLSearchParams
      ? stringOrMap
      : new URLSearchParams(stringOrMap)

  const {
    currentSpineItemIndex: currentSpineItemIndexKey,
    spreadIndex: spreadIndexKey,
  } = searchParamKeys

  if (!params.has(currentSpineItemIndexKey)) {
    params.set(currentSpineItemIndexKey, 0)
  }

  if (!params.has(spreadIndexKey)) {
    params.set(spreadIndexKey, 0)
  }

  return params
}
