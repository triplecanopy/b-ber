we're continuing a refactor of a legacy application to bring it up to date using modern tooling, structure and best practices. we've done a few passes already, read through the past two commits (8173575c and 69b394ec) if you need to see detailed changes. read through @IMPROVEMENT_PLAN.md for the big-picture, and you can see the current state of things by reading @MIGRATION_STATUS.md. you can also see the changed files in git if you want to see recent, uncommitted changes.

we need to fix some bugs that have been introduced. we just tried to fix all of these at once, and that didn't work, so we're taking a more systematic approach:

read through the @BUGS.md file and choose one that has not been completed (there will be an empty checkbox `[ ]` beside the title). you probably want to start at the top of the list.

then fix that bug. once you're done, update the @BUG_STATUS.md file with any notes, and also update the @BUGS.md file to check the box. include testing notes similar to what you have been doing in the @MIGRATION_STATUS.md docu
