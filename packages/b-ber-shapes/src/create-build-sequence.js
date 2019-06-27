import sequences from './sequences'

export default function createBuildSequence(argv) {
    // set up an array of build types
    const builds = Object.keys(sequences)

    // filter the desired builds
    const chosen = argv._.filter(a => sequences[a])

    // get the task sequence
    const sequence = chosen.length < 1 ? builds : chosen

    return sequence
}
