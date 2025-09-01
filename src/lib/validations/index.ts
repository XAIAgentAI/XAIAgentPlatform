import { z } from 'zod'

export const userSchema = z.object({
  address: z.string(),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof userSchema>
