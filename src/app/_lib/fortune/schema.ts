// src/app/_lib/fortune/schema.ts
import { z } from 'zod'

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export const FortunePayloadSchema = z.object({
  headline: z.string().min(1),
  advice:   z.string().min(1),
  lucky: z.object({
    color: z.object({
      name: z.string().min(1),
      hex:  z.string().regex(HEX_RE),
    }),
    number: z.number().int().min(1).max(99),
    item:   z.string().min(1),
  }),
})

export type FortunePayload = z.infer<typeof FortunePayloadSchema>
