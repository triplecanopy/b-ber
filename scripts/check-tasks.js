#!/usr/bin/env node

// Reconciles tasks/ against GitHub. The epic assignment is the one fact this
// repo stores twice — as **Epic:** in the task file and as the issue's parent
// on GitHub — so it is the one thing that can silently disagree. This is what
// catches that, plus the stray-vocabulary case (`Unit test coverage (epic)`)
// that sat in the tree unnoticed until 2026-09-23.
//
//   node scripts/check-tasks.js            offline: vocabulary + well-formedness
//   node scripts/check-tasks.js --remote   also reconciles titles and parents

const { readFile, readdir } = require('node:fs/promises')
const { execFile } = require('node:child_process')
const path = require('node:path')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)

const TASKS_DIR = path.resolve(__dirname, '..', 'tasks')
const REGISTRY = path.join(TASKS_DIR, 'EPICS.json')
const HEADING = /^# (TASK-\d{3}): (.+)$/
const ISSUE_URL = 'https://github.com/triplecanopy/b-ber/issues'

const field = (source, name) => {
  const match = source.match(new RegExp(`^\\*\\*${name}:\\*\\* (.+)$`, 'm'))
  return match ? match[1].trim() : null
}

async function readTasks() {
  const entries = await readdir(TASKS_DIR)
  const tasks = []

  for (const entry of entries.sort()) {
    if (!entry.startsWith('TASK-') || !entry.endsWith('.md')) continue

    const file = path.join(TASKS_DIR, entry)
    const source = await readFile(file, 'utf8')
    const heading = source.split('\n')[0].match(HEADING)

    // Companion documents (findings, notes) live here too and carry no issue.
    if (!heading) continue

    const issue = field(source, 'GitHub Issue')

    tasks.push({
      name: heading[1],
      title: heading[2],
      relative: path.join('tasks', entry),
      epic: field(source, 'Epic'),
      retired: field(source, 'Retired'),
      issue: issue ? Number(issue.match(/#(\d+)/)?.[1]) : null,
    })
  }

  return tasks
}

async function githubIssues() {
  const { stdout } = await execFileAsync('gh', [
    'issue',
    'list',
    '--limit',
    '400',
    '--state',
    'all',
    '--json',
    'number,title,state,parent',
  ])

  return JSON.parse(stdout)
}

async function main() {
  const remote = process.argv.includes('--remote')
  const { epics } = JSON.parse(await readFile(REGISTRY, 'utf8'))
  const tasks = await readTasks()
  const errors = []

  for (const task of tasks) {
    if (!task.epic) {
      errors.push(`${task.relative}: no **Epic:** field`)
      continue
    }

    if (!(task.epic in epics)) {
      const known = Object.keys(epics).join(', ')
      errors.push(
        `${task.relative}: **Epic:** ${task.epic} is not a declared epic\n` +
          `    declared in tasks/EPICS.json: ${known}`,
      )
    }
  }

  if (remote) {
    const issues = await githubIssues()
    const byNumber = new Map(issues.map(issue => [issue.number, issue]))
    const byTask = new Map()

    for (const issue of issues) {
      const match = issue.title.match(/^(TASK-\d{3}):/)
      if (match) byTask.set(match[1], issue)
    }

    for (const task of tasks) {
      if (task.retired) continue

      const issue = task.issue ? byNumber.get(task.issue) : null

      if (task.issue && !issue) {
        errors.push(`${task.relative}: **GitHub Issue:** #${task.issue} does not exist`)
        continue
      }

      // Closed tasks are archive. Their issues predate this hierarchy, were
      // never parented, and use older title conventions — reconciling them
      // would report ~99 problems that are all correct as they stand.
      if (!issue || issue.state !== 'OPEN') continue

      if (issue.title !== `${task.name}: ${task.title}`) {
        errors.push(
          `${task.relative}: title disagrees with #${issue.number}\n` +
            `    file:  ${task.name}: ${task.title}\n` +
            `    issue: ${issue.title}`,
        )
      }

      if (task.epic in epics) {
        const expected = epics[task.epic]
        const actual = issue.parent ? issue.parent.number : null

        // A task may hang off a parent *task* rather than the epic directly
        // (TASK-122–125 under TASK-121). Walk up before calling it a mismatch.
        let cursor = actual
        let resolved = null
        const seen = new Set()

        while (cursor && !seen.has(cursor)) {
          seen.add(cursor)
          if (cursor === expected) {
            resolved = cursor
            break
          }
          const above = byNumber.get(cursor)
          cursor = above?.parent ? above.parent.number : null
        }

        if (!resolved) {
          errors.push(
            `${task.relative}: **Epic:** ${task.epic} (#${expected})\n` +
              `    but #${issue.number}'s parent chain is ${actual ? `#${actual}` : 'empty'}\n` +
              `    ${ISSUE_URL}/${issue.number}`,
          )
        }
      }
    }

    // An open task issue with no file is the other direction of the same drift.
    for (const [name, issue] of byTask) {
      if (issue.state !== 'OPEN') continue
      if (!tasks.some(task => task.name === name)) {
        errors.push(`#${issue.number} (${name}) is open but tasks/${name}.md does not exist`)
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):\n`)
    for (const error of errors) console.error(`  ${error}`)
    console.error('')
    process.exit(1)
  }

  const scope = remote ? 'and reconciled against GitHub' : '(offline checks only)'
  console.log(`${tasks.length} task files checked ${scope} — no problems`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
