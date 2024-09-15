import { z } from 'zod'

export const ZodRoleEnum = z.enum(['ADMIN', 'USER'])

export const ZodUserSchema = z.object({
  id: z.string().uuid(),
  role: ZodRoleEnum,
  firstName: z.string().min(3),
  lastName: z.string().min(3),
})
export type User = z.infer<typeof ZodUserSchema>

export const ZodUserInputSchema = ZodUserSchema.omit({
  id: true,
})
