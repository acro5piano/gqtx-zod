import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { GraphQLError } from 'graphql'

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<keyof T>
}

export function validateArg(args: object, schema: z.ZodSchema) {
  const res = schema.safeParse(args)
  if (!res.success) {
    const msg = fromZodError(res.error).toString()
    throw new GraphQLError(msg)
  }
}
