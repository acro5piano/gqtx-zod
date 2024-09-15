import { z } from 'zod'
import {
  EnumType,
  Gql,
  type Field,
  type InputFieldMap,
  type ScalarType,
} from 'gqtx'
import { keys } from './util'
import { DateTimeScalar } from './DateTimeScalar'

const enumMap: Record<string, EnumType<any>> = {}

export function registerEnum<T extends [string, ...string[]]>(
  name: string,
  zodEnum: z.ZodEnum<T>,
  options: { description?: string },
) {
  const { description = name } = options
  const enu = Gql.Enum({
    name,
    values: keys(zodEnum.enum).map((key) => ({ name: key, value: key })),
    description,
  })
  enumMap[name] = enu
  Object.assign(zodEnum, { __gqlName: name })
  return enu
}

type GqlFields = [Field<any, any, {}>, ...Field<any, any, {}>[]]

export function objectTypeFromZodObject<T extends z.ZodRawShape>(
  name: string,
  zodObj: z.ZodObject<T>,
  options: {
    description?: string
    fieldResolvers?: () => Field<z.infer<z.ZodObject<T>>, any, {}>[]
  },
) {
  const { description = name, fieldResolvers } = options
  const fields = [] as any as GqlFields

  for (const key of keys(zodObj.shape)) {
    const value = zodObj.shape[key]
    const gqlType = zodScalarToGqlScalar(value)
    if (gqlType) {
      if (value instanceof z.ZodArray) {
        fields.push(
          Gql.Field({
            name: key as string,
            type: Gql.NonNull(Gql.List(Gql.NonNull(gqlType))),
          }),
        )
      } else if (value.isNullable() || value.isOptional()) {
        fields.push(Gql.Field({ name: key as string, type: gqlType }))
      } else {
        fields.push(
          Gql.Field({ name: key as string, type: Gql.NonNull(gqlType) }),
        )
      }
    }
  }
  if (typeof fieldResolvers === 'function') {
    for (const f of fieldResolvers()) {
      fields.push(f)
    }
  }

  const gqlType = Gql.Object({
    name,
    description,
    fields: () => fields,
  })
  return gqlType
}

// inputObjectFromZodObject,

function zodScalarToGqlScalar(zodType: z.ZodType): null | ScalarType<any> {
  if (zodType instanceof z.ZodUnion) {
    // Since GraphQL doesn't allow union scalar, getting [0] is enough.
    // https://stackoverflow.com/questions/49897319/graphql-union-scalar-type
    return zodScalarToGqlScalar(zodType._def.options[0])
  }
  if (zodType instanceof z.ZodArray) {
    return zodScalarToGqlScalar(zodType.element)
  }
  if (
    zodType instanceof z.ZodOptional ||
    zodType instanceof z.ZodNullable ||
    zodType instanceof z.ZodBranded
  ) {
    return zodScalarToGqlScalar(zodType.unwrap())
  }
  if (zodType instanceof z.ZodString) {
    if (zodType.isUUID) {
      return Gql.ID
    } else {
      return Gql.String
    }
  }
  if (zodType instanceof z.ZodBoolean) {
    return Gql.Boolean
  }
  if (zodType instanceof z.ZodDate) {
    return DateTimeScalar
  }
  if (zodType instanceof z.ZodEnum) {
    const e = enumMap[zodType.__gqlName]
    if (!e) {
      throw new Error('Enum is not registered')
    }
    // @ts-ignore: why???
    return e
  }
  if (zodType instanceof z.ZodNumber) {
    if (zodType.isInt) {
      return Gql.Int
    } else {
      return Gql.Float
    }
  }
  return null
}
