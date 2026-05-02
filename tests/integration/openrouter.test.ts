// tests/integration/openrouter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callOpenRouter } from '@/app/_lib/fortune/openrouter'

const ENV = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash',
  OPENROUTER_REFERER: 'http://localhost:3000',
  OPENROUTER_TITLE: 'Test',
}

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    json: async () => body,
  }))
}

describe('callOpenRouter', () => {
  it('returns the assistant content on 200', async () => {
    mockFetch(200, {
      choices: [{ message: { content: '{"headline":"x","advice":"y","lucky":{"color":{"name":"a","hex":"#000000"},"number":1,"item":"z"}}' } }],
    })
    const result = await callOpenRouter({ system: 'sys', user: 'usr' })
    expect(result.content).toContain('"headline":"x"')
    expect(result.model).toBe('google/gemini-2.5-flash')
  })

  it('throws on non-2xx', async () => {
    mockFetch(429, { error: 'rate limited' })
    await expect(callOpenRouter({ system: 'sys', user: 'usr' })).rejects.toThrow(/429/)
  })

  it('respects timeout via AbortController', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    }))
    await expect(callOpenRouter({ system: 'sys', user: 'usr', timeoutMs: 10 })).rejects.toThrow()
  })
})
