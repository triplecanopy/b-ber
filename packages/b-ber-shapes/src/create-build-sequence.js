import sequences from './sequences'

export default function createBuildSequence(argv) {
    // set up an array of build types
    const buildTypes = Object.keys(sequences)

    // filter the desired builds
    const builds = argv._.filter(a => sequences[a])

    // get the task sequence
    const sequence = builds.length < 1 ? buildTypes : builds

    return sequence
}
