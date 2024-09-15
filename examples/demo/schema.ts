import { Gql, buildGraphQLSchema } from 'gqtx'
import {
  registerEnum,
  objectTypeFromZodObject,
  inputObjectFromZodObject,
} from '../../src'
import {
  User,
  ZodRoleEnum,
  ZodUserSchema,
  ZodUserInputSchema,
} from './zod-types'
import { randomUUID } from 'crypto'

const users: User[] = [
  { id: '1', role: 'ADMIN', firstName: 'Sikan', lastName: 'Smith' },
  { id: '2', role: 'USER', firstName: 'Nicole', lastName: 'Doe' },
]

registerEnum('Role', ZodRoleEnum, {
  description: 'A user role',
})

const UserType = objectTypeFromZodObject('User', ZodUserSchema, {
  description: 'A User',
  fieldResolvers: () => [
    Gql.Field({
      name: 'fullName',
      type: Gql.NonNull(Gql.String),
      resolve(user) {
        return `${user.firstName} ${user.lastName}`
      },
    }),
  ],
})

const UserInput = inputObjectFromZodObject('UserInput', ZodUserInputSchema, {
  description: 'A User input',
})

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
        ZodUserInputSchema.parse(args.input)
        const id = randomUUID()
        const newUser: User = { id, ...args.input }
        // `args` is automatically inferred as { input: z.infer<typeof ZodUserInputSchema> }
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
