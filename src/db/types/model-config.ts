export type PrimaryKeyType = "uuid" | "int"

export type IModelConfig = {
  tableName: string
  primaryKeyType: PrimaryKeyType
  properties: Record<string, {
    type: string
    label: string
    isRequired: boolean
  }>
}
