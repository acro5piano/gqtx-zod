import { Gql, buildGraphQLSchema } from 'gqtx'
import {
  registerEnum,
  objectTypeFromZodObject,
  // inputObjectFromZodObject,
} from '../../src'
import { User, ZodRoleEnum, ZodUserSchema } from './zod-types'

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

export const schema = buildGraphQLSchema({
  query: Query,
})
