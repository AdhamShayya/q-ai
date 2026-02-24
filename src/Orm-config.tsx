import { AnalyticsModelConfig } from "./model-schemas/Analytics.schema"
import { BrandModelConfig } from "./model-schemas/Brand.schema"
import { EditorModelConfig } from "./model-schemas/Editor.schema"
import { FileObjectModelConfig } from "./model-schemas/FileObject.schema"
import { ServiceModelConfig } from "./model-schemas/Service.schema"
import { UserModelConfig } from "./model-schemas/User.schema"
import { UserSessionModelConfig } from "./model-schemas/UserSession.schema"

export const modelConfigs = {
    User: UserModelConfig,
    Brand: BrandModelConfig,
    Editor: EditorModelConfig,
    Service: ServiceModelConfig,
    Analytics: AnalyticsModelConfig,
    FileObject: FileObjectModelConfig,
    UserSession: UserSessionModelConfig
}