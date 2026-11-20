// File helpers for tests that run tasks against a temp project.

import fs from 'fs-extra'

// The start of a PNG: the signature and an IHDR chunk. That is all
// image-size reads, so it is enough for anything that asks for an image's
// dimensions. The CRC is left zeroed; nothing here decodes the pixels.
export const png = (width, height) => {
  const buf = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0)
  buf.writeUInt32BE(13, 8) // IHDR's data is always 13 bytes long
  buf.write('IHDR', 12, 'ascii')
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  buf.writeUInt8(8, 24) // bit depth
  buf.writeUInt8(2, 25) // colour type: truecolour
  return buf
}

// `render` does not wait for its own writes (#770). This spies on
// fs.writeFile, calling through, and keeps the promises so a test can wait
// for them with `settle` before reading the files or removing the project.
// `settle` waits for failed writes too, without rethrowing: a test that
// expects one to fail asserts on the task's own rejection. Restored by
// `jest.restoreAllMocks`.
export const trackWrites = () => {
  const writes = []
  const writeFile = fs.writeFile
  jest.spyOn(fs, 'writeFile').mockImplementation((...args) => {
    const p = writeFile(...args)
    writes.push(p)
    return p
  })
  return () => Promise.allSettled(writes)
}
