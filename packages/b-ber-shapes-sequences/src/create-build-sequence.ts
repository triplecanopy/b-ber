import sequences from './sequences'

export default function createBuildSequence(desiredSequences: string[]): string[] {
  const builds = Object.keys(sequences)
  const chosen = desiredSequences.filter(a => sequences[a])
  const sequence = chosen.length < 1 ? builds : chosen
  return sequence
}
