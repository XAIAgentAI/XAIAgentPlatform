import { z } from 'zod'

export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
})

export type CreateUserInput = z.infer<typeof userSchema>
