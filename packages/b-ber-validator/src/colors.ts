// The SGR codes `report` colours its output with
const SGR = {
  bold: 1,
  dim: 2,
  red: 31,
  yellow: 33,
  cyan: 36,
} as const

export type Style = keyof typeof SGR

// `text` in `styles`, or as it is when none are given
export const paint = (text: string, ...styles: Style[]): string =>
  styles.length
    ? `\x1b[${styles.map((s) => SGR[s]).join(';')}m${text}\x1b[0m`
    : text
