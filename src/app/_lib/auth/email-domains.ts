export function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? ''
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedDomain(email: string): boolean {
  const allowed = getAllowedDomains()
  if (allowed.length === 0) return true

  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain) return false

  return allowed.includes(domain)
}
