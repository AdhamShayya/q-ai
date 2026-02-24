import { type, Type } from "arktype"

// Wraps an arktype schema into the { parse(input): T } shape that tRPC expects.
// The return type is inferred directly from the schema — no manual generic needed.
export function ark<S extends Type>(schema: S) {
  return {
    parse(input: unknown): S["infer"] {
      const result = schema(input)
      if (result instanceof type.errors) throw new Error(result.summary)
      return result
    },
  }
}
