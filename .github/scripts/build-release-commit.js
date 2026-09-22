// Builds the GraphQL payload for createCommitOnBranch.
//
// Why not `git commit`: main's ruleset requires verified signatures, and a
// runner has no signing key — a plain commit by github-actions[bot] comes back
// `verified: false, reason: unsigned` and the release PR cannot be merged.
// Commits authored through this mutation are signed by GitHub itself ("GitHub
// Web Flow"), which satisfies the rule without putting a private key in secrets.
//
// Reads the uncommitted bump `lerna version` left in the working tree.

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')

const [version, branch, baseSha, repo, outFile] = process.argv.slice(2)

if (!version || !branch || !baseSha || !repo || !outFile) {
  console.error(
    'usage: build-release-commit.js <version> <branch> <baseSha> <owner/repo> <outFile>'
  )
  process.exit(1)
}

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean)

// --diff-filter=d excludes deletions, which are handled separately below.
const changed = git('diff', '--name-only', '--diff-filter=d')
const deleted = git('diff', '--name-only', '--diff-filter=D')

// A version bump only ever rewrites these three filenames. Anything else in the
// working tree is not part of the release, and silently folding it into a commit
// titled "4.0.3" is how unreviewed changes ride out in a release. Fail instead.
const BUMP_FILES = new Set(['package.json', 'package-lock.json', 'lerna.json'])
const isBumpFile = (path) => BUMP_FILES.has(path.split('/').pop())

if (deleted.length > 0) {
  console.error(`refusing to commit deletions: ${deleted.join(', ')}`)
  process.exit(1)
}

const unexpected = changed.filter((path) => !isBumpFile(path))
if (unexpected.length > 0) {
  console.error('working tree has changes that are not a version bump:')
  for (const path of unexpected) console.error(`  ${path}`)
  console.error('refusing to fold these into a release commit')
  process.exit(1)
}

if (changed.length === 0) {
  console.error('no changes in the working tree — did `lerna version` run?')
  process.exit(1)
}

const additions = changed.map((path) => ({
  path,
  contents: fs.readFileSync(path).toString('base64'),
}))

const payload = {
  query: `
    mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
          oid
          url
          signature {
            isValid
          }
        }
      }
    }
  `,
  variables: {
    input: {
      branch: { repositoryNameWithOwner: repo, branchName: branch },
      expectedHeadOid: baseSha,
      // Matches the subject lerna used for past version commits.
      message: { headline: version },
      fileChanges: { additions },
    },
  },
}

const json = JSON.stringify(payload)
fs.writeFileSync(outFile, json)

const megabytes = (json.length / 1024 ** 2).toFixed(2)
console.log(`${additions.length} files, ${megabytes} MB payload`)
for (const { path } of additions) console.log(`  ${path}`)
