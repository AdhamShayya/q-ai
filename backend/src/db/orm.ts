import UserModel from "./models/User"
import type { IUserSchema } from "./schemas/User.schema"

export interface IDatabase {
  User: IUserSchema
}

export const ORM = {
  User: UserModel,
} as const
