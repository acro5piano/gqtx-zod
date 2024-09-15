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
export type User = z.infer<typeof ZodUserSchema>

export const ZodUserInputSchema = ZodUserSchema.omit({
  // id is auto-generated, so the client can't specify it
  id: true,
})
```

Then, create your schema using gqtx and gqtx-zod:

```typescript
// schema.ts

import { Gql, buildGraphQLSchema } from 'gqtx'
import { randomUUID } from 'crypto'
import {
  registerEnum,
  objectTypeFromZodObject,
  inputObjectFromZodObject,
  validateArg,
} from '../../src'

import {
  User,
  ZodRoleEnum,
  ZodUserSchema,
  ZodUserInputSchema,
} from './zod-types'

const users: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'ADMIN',
    firstName: 'Sikan',
    lastName: 'Smith',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    role: 'USER',
    firstName: 'Nicole',
    lastName: 'Doe',
  },
]

registerEnum('Role', ZodRoleEnum, {
  description: 'A user role',
})

// By specifying ZodUserSchema, all fields of ZodUserSchema will be implemented in `UserType`
const UserType = objectTypeFromZodObject('User', ZodUserSchema, {
  description: 'A User',
  // You can still implement fields not specified in the zod type
  fieldResolvers: () => [
    Gql.Field({
      name: 'fullName',
      type: Gql.NonNull(Gql.String),
      resolve(user) {
        // `user` is infered as `z.infer<typeof ZodUserSchema>`
        return `${user.firstName} ${user.lastName}`
      },
    }),
  ],
})

// You can create GraphQL Input from Zod type
const UserInput = inputObjectFromZodObject('UserInput', ZodUserInputSchema, {
  description: 'A User input',
})

// Nothing special here. gqtx magic works as expected.
const Query = Gql.Query({
  fields: () => [
    Gql.Field({
      name: 'userById',
      type: UserType,
      args: {
        id: Gql.Arg({ type: Gql.NonNullInput(Gql.String) }),
      },
      resolve(_, args) {
        // `args` is automatically inferred as { id: string }
        const user = users.find((u) => u.id === args.id)
        // Also ensures we return an `User | null | undefined` type
        return user
      },
    }),
    Gql.Field({
      name: 'users',
      type: Gql.NonNull(Gql.List(Gql.NonNull(UserType))),
      resolve() {
        return users
      },
    }),
  ],
})

const Mutation = Gql.Mutation({
  fields: () => [
    Gql.Field({
      name: 'createUser',
      type: UserType,
      args: {
        input: Gql.Arg({ type: Gql.NonNullInput(UserInput) }),
      },
      resolve(_, args) {
        // Helper function to validate args input with Zod
        // If input has wrong value, it raises an human-readable error
        validateArg(args.input, ZodUserInputSchema)
        // `args.input` is automatically inferred as `z.infer<typeof ZodUserInputSchema>`
        // with the power of gqtx and a type magic.
        const newUser: User = { id: randomUUID(), ...args.input }
        users.push(newUser)
        return newUser
      },
    }),
  ],
})

export const schema = buildGraphQLSchema({
  query: Query,
  mutation: Mutation,
})
```

Finally, use your favorite server option to serve the schema!

```typescript
// serve.ts

import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema'

const yoga = createYoga({ schema })

const server = createServer(yoga)

// Start the server and you're done!
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
```
