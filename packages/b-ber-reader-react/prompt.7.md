we're continuing a refactor of a legacy application to bring it up to date using modern tooling, structure and best practices. we've done a few passes already, read through the commit history (starting at 69b394ec) if you need to see detailed changes. read through @IMPROVEMENT_PLAN.md for the big-picture, and you can see the current state of things by reading @MIGRATION_STATUS.md.

we need to fix some bugs that have been introduced. we just tried to fix all of these at once, and that didn't work, so we're taking a more systematic approach:

read through the @BUGS.md file and and find the bug 'full-bleed "spreads" are out of sync with visible page'. read the current and expected behaviour for that bug, and then fix that bug. update the @BUG_STATUS.md file with any notes, and also update the @BUGS.md file to check the box. include testing notes similar to what you have been doing in the @MIGRATION_STATUS.md doc
