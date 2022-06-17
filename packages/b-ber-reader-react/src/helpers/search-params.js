export const getUrlParams = stringOrMap =>
  stringOrMap instanceof URLSearchParams
    ? stringOrMap
    : new URLSearchParams(stringOrMap)

// Test if params are valid
export const hasSearchParams = (stringOrMap, searchParamKeys) => {
  if (!stringOrMap) return false

  const params = getUrlParams(stringOrMap)

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
  const params = getUrlParams(stringOrMap)

  const {
    currentSpineItemIndex: currentSpineItemIndexKey,
    spreadIndex: spreadIndexKey,
    slug: slugKey,
  } = searchParamKeys

  const allowed = new Set([currentSpineItemIndexKey, spreadIndexKey, slugKey])

  params.forEach((_, key) => {
    if (!allowed.has(key)) {
      params.delete(key)
    }
  })

  return params
}

// Ensure required values are set
export const ensureSearchParams = (stringOrMap, searchParamKeys) => {
  const params = getUrlParams(stringOrMap)

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

// Exclude b-ber params
export const excludeSearchParams = (stringOrMap, searchParamKeys) => {
  const params = getUrlParams(stringOrMap)

  const {
    currentSpineItemIndex: currentSpineItemIndexKey,
    spreadIndex: spreadIndexKey,
    slug: slugKey,
  } = searchParamKeys

  params.delete(currentSpineItemIndexKey)
  params.delete(spreadIndexKey)
  params.delete(slugKey)

  return params
}

export const appendExternalParams = (stringOrMap, searchParamKeys) => {
  const params = getUrlParams(stringOrMap)
  const external = excludeSearchParams(window.location.search, searchParamKeys)

  // eslint-disable-next-line no-unused-vars
  for (const [key, val] of external) {
    params.set(key, val)
  }

  return params
}
