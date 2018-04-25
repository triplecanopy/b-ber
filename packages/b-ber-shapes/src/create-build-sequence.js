import {pick, filter} from 'lodash'
import sequences from './sequences'

export default function createBuildSequence(argv) {
    // set up an array of build types
    const buildTypes = Object.keys(sequences)

    // get args passed to the cli
    const buildArgs = pick(argv, buildTypes)

    // filter the desired builds
    const builds = filter(buildTypes, a => buildArgs[a])

    // get the task sequence
    const sequence = builds.length < 1 ? buildTypes : builds

    return sequence
}
