export const isNumeric = val => typeof val === 'number' && Number.isNaN(val) === false && Number.isFinite(val) === true
export const isInt = val => isNumeric(val) && val % 1 === 0
export const isFloat = val => isNumeric(val) && val % 1 !== 0
