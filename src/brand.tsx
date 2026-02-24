import { BaseModel } from "@fd-lib/orm/db/model"
import { BrandModelConfig, IBrandSchema } from "../model-schemas/Brand.schema"

class BrandBaseModel extends BaseModel
    IBrandSchema,
    {
        r: {}
        j: {}
        deleteWhereArgs: { id: IBrandSchema["id"] }
    }
> {}

const BrandModel = new BrandBaseModel({
    hooks: {},
    config: BrandModelConfig
})

export default BrandModel