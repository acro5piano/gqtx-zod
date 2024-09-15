import { Gql } from 'gqtx'
import { GraphQLDateTime } from 'graphql-scalars'

export const DateTimeScalar = Gql.Scalar({
  ...GraphQLDateTime,
  description: 'DateTime',
})
