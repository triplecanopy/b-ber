import * as Url from './Url'

interface RequestResult {
  // Response body — JSON parses to arbitrary shapes, text to string.
  // TODO: type this per call site.
  data: any
  request: { ok: boolean; status: number; url: string }
}

export async function get(
  requestUrl: string,
  type: 'json' | 'text'
): Promise<RequestResult> {
  const resp = await fetch(requestUrl)
  const { ok, status, url } = resp

  const data = await resp[type]()

  return { data, request: { ok, status, url } }
}

export async function getJson(requestUrl: string): Promise<RequestResult> {
  return get(requestUrl, 'json')
}

export async function getText(requestUrl: string): Promise<RequestResult> {
  return get(requestUrl, 'text')
}

export function getBooks(basePath = ''): Promise<RequestResult> {
  const url = `${Url.stripTrailingSlash(basePath)}/api/books.json`
  return getJson(url)
}
