import { afterEach, describe, expect, test } from 'vitest'
import { isAllowedDomain } from '@/app/_lib/auth/email-domains'

const ENV_KEY = 'ALLOWED_EMAIL_DOMAINS'

afterEach(() => {
  delete process.env[ENV_KEY]
})

describe('isAllowedDomain', () => {
  test('환경변수가 비어있으면 모든 도메인을 허용한다', () => {
    expect(isAllowedDomain('foo@gmail.com')).toBe(true)
    expect(isAllowedDomain('bar@anywhere.io')).toBe(true)
  })

  test('환경변수가 미정의면 모든 도메인을 허용한다', () => {
    delete process.env[ENV_KEY]
    expect(isAllowedDomain('foo@gmail.com')).toBe(true)
  })

  test('단일 도메인이 등록되면 그 도메인만 허용한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('alice@gmail.com')).toBe(false)
  })

  test('콤마로 여러 도메인을 등록할 수 있다', () => {
    process.env[ENV_KEY] = 'company.com,subsidiary.co.kr'
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('bob@subsidiary.co.kr')).toBe(true)
    expect(isAllowedDomain('charlie@gmail.com')).toBe(false)
  })

  test('대소문자를 가리지 않는다', () => {
    process.env[ENV_KEY] = 'Company.COM'
    expect(isAllowedDomain('alice@COMPANY.com')).toBe(true)
    expect(isAllowedDomain('alice@company.com')).toBe(true)
  })

  test('도메인 양쪽 공백을 트림한다', () => {
    process.env[ENV_KEY] = '  company.com ,  other.com  '
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('bob@other.com')).toBe(true)
  })

  test('@ 기호가 없는 입력은 거절한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('not-an-email')).toBe(false)
  })

  test('@ 뒤 도메인이 비어있는 입력은 거절한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('alice@')).toBe(false)
  })
})
