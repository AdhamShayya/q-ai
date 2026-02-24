import { IUserSchema } from "./model-schemas/User.schema"
import UserModel from "./models/User"
import { IServiceSchema } from "./model-schemas/Service.schema"
import ServiceModel from "./models/Service"
import { IFileObjectSchema } from "./model-schemas/FileObject.schema"
import FileObjectModel from "./models/FileObject"
import { IUserSessionSchema } from "./model-schemas/UserSession.schema"
import UserSessionModel from "./models/UserSession"
import { IEditorSchema } from "./model-schemas/Editor.schema"
import EditorModel from "./models/Editor"
import { IBrandSchema } from "./model-schemas/Brand.schema"
import BrandModel from "./models/Brand"
import { IAnalyticsSchema } from "./model-schemas/Analytics.schema"
import AnalyticsModel from "./models/Analytics"
export interface IDatabase {
    User: IUserSchema
    Service: IServiceSchema
    FileObject: IFileObjectSchema
    UserSession: IUserSessionSchema
    Editor: IEditorSchema
    Brand: IBrandSchema
    Analytics: IAnalyticsSchema
}
export const modelsMapForORMObject: { [key in keyof IDatabase]: any } = {
    User: UserModel,
    Service: ServiceModel,
    FileObject: FileObjectModel,
    UserSession: UserSessionModel,
    Editor: EditorModel,
    Brand: BrandModel,
    Analytics: AnalyticsModel,
} as const

export const ORM = { ...modelsMapForORMObject }