import { eq } from "drizzle-orm"

import { users } from "../schemas/User.schema"
import { BaseModel } from "../base-model"
import { UserModelConfig, type IUserSchema, type IUserPublic } from "../schemas/User.schema"

class UserModel extends BaseModel<IUserSchema> {
  async findByEmail(email: string): Promise<IUserSchema | null> {
    return this.findOneWhere(eq(users.email, email.toLowerCase()))
  }

  // Strip password before returning
  toPublic(user: IUserSchema): IUserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}

export default new UserModel(UserModelConfig, users)
