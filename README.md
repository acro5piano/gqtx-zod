# gqtx-zod

gqtx-zod: Seamlessly Integrate Zod and gqtx for easy Type-Safe GraphQL APIs.

# Installation

Install using the dependency manager of your choice.

```bash
# npm
npm install --save gqtx-zod

# pnpm
pnpm add gqtx-zod

# Yarn
yarn add gqtx-zod

# Bun
bun add gqtx-zod
```

# Usage

First, create your Zod types:

```typescript
// zod-types.ts

import { z } from 'zod'

export const ZodRoleEnum = z.enum(['ADMIN', 'USER'])

export const ZodUserSchema = z.object({
  id: z.string().uuid(),
  role: ZodRoleEnum,
  firstName: z.string().min(3),
  lastName: z.string().min(3),
})
export type User = z.infer<typeof UserSchema>
```

Then, create your schema using gqtx and gqtx-zod:

```typescript
import { Gql, buildGraphQLSchema } from 'gqtx'
import { registerEnum, objectTypeFromZodObject, inputObjectFromZodObject } from 'gqtx-zod'
import { ZodRoleEnum, ZodUserSchema } from './zod-types'

const users: User[] = [
  { id: '1', role: Role.Admin, firstName: 'Sikan', lastName: 'Smith', },
  { id: '2', role: Role.User, firstName: 'Nicole', lastName: 'Doe', },
]


registerEnum('Role', ZodRoleEnum, {
  description: 'A user role',
})

const UserType = objectTypeFromZodObject('User', ZodUserSchema, {
  description: 'A User',
  fieldResolvers: () => ({
    fullName: {
      type: Gql.NonNull(Gql.String()),
      resolve(user) {
        return `${user.firstName} ${user.lastName}`
      },
    },
  }),
})

const Query = Gql.Query({
  fields: [
    Gql.Field({
      name: 'userById',
      type: UserType,
      args: inputObjectFromZodObject(z.object({
        id: z.string().uuid(),
      }),
      resolve: (_, args, ctx) => {
        // `args` is automatically inferred as { id: string }
        const user = users.find((u) => u.id === args.id)
        // Also ensures we return an `User | null | undefined` type
        return user
      },
    }),
  ],
})

const schema = buildGraphQLSchema({
  query: Query,
})
```
