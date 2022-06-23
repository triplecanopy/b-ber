import sequences from './sequences'

export default function createBuildSequence(desiredSequences) {
  // Set up an array of build types
  const builds = Object.keys(sequences)

  // Filter the desired builds
  const chosen = desiredSequences.filter(a => sequences[a])

  // Get the task sequence
  const sequence = chosen.length < 1 ? builds : chosen

  return sequence
}
