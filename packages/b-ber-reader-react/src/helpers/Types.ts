export const isNumeric = (val: unknown): val is number =>
  typeof val === 'number' &&
  Number.isNaN(val) === false &&
  Number.isFinite(val) === true
export const isInt = (val: unknown): boolean => isNumeric(val) && val % 1 === 0
export const isFloat = (val: unknown): boolean =>
  isNumeric(val) && val % 1 !== 0
