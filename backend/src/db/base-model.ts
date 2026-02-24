import { eq, type SQL } from "drizzle-orm"
import { type PgTable } from "drizzle-orm/pg-core"
import { db } from "./index"
import type { IModelConfig } from "./types/model-config"

function idCol(table: PgTable): SQL {
  return (table as unknown as Record<string, SQL>)["id"] as SQL
}

export class BaseModel<TSchema extends object> {
  readonly config: IModelConfig
  readonly table: PgTable

  constructor(config: IModelConfig, table: PgTable) {
    this.config = config
    this.table = table
  }

  async findById(id: string): Promise<TSchema | null> {
    const rows = await db.select().from(this.table).where(eq(idCol(this.table), id)).limit(1)
    return ((rows as unknown[])[0] as TSchema) ?? null
  }

  async findAll(): Promise<TSchema[]> {
    const rows = await db.select().from(this.table)
    return rows as unknown as TSchema[]
  }

  async findWhere(condition: SQL): Promise<TSchema[]> {
    const rows = await db.select().from(this.table).where(condition)
    return rows as unknown as TSchema[]
  }

  async findOneWhere(condition: SQL): Promise<TSchema | null> {
    const rows = await db.select().from(this.table).where(condition).limit(1)
    return ((rows as unknown[])[0] as TSchema) ?? null
  }

  async create(data: Record<string, unknown>): Promise<TSchema> {
    const rows = await db.insert(this.table).values(data as never).returning()
    return (rows as unknown[])[0] as TSchema
  }

  async updateById(id: string, data: Record<string, unknown>): Promise<TSchema | null> {
    const rows = await db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() } as never)
      .where(eq(idCol(this.table), id))
      .returning()
    return ((rows as unknown[])[0] as TSchema) ?? null
  }

  async deleteById(id: string): Promise<string | null> {
    const rows = await db
      .delete(this.table)
      .where(eq(idCol(this.table), id))
      .returning({ id: idCol(this.table) })
    const row = (rows as unknown[])[0] as Record<string, unknown> | undefined
    return row != null ? String(row["id"]) : null
  }
}
