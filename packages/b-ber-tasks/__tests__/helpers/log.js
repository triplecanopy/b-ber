// These tests automock b-ber-logger to keep its output out of the run. An
// automocked `log.error` returns undefined, so a task's `throw log.error(err)`
// would throw undefined. This gives the mock the real one's contract: it
// returns the error it was given, or a new Error made from a message.
//
// isNativeError, not instanceof: the root Jest run uses jsdom, and an error
// from Node's fs comes from another realm, so it is not an `Error` here.
//
// Call it in a `beforeEach`: `jest.resetAllMocks` clears the implementation.

import { types } from 'node:util'

export const returnReportedErrors = (log) =>
  log.error.mockImplementation((err) =>
    types.isNativeError(err) || err instanceof Error
      ? err
      : new Error(String(err))
  )
