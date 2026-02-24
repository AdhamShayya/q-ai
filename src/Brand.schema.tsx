export interface IBrandSchema {
	id: string
	serviceId: string
	brandMainImage: {
		src: string
		width: number
		height: number
		aspectRatio: number
	}
	serviceName: string
	serviceType: string
	serviceReleaseDate: string
	titleHTML?: null | string
	mobileTitleHTML?: null | string
	order: number
	description: string
	tags?: null | Array<{
		tag: string
		isSelected?: null | boolean
	}>
	firstColumn?: null | {
		images?: null | Array<{
			image?: null | {
				src: string
				width: number
				height: number
				aspectRatio: number
			}
			mobileImage?: null | {
				src: string
				width: number
				height: number
				aspectRatio: number
			}
		}>
	}
	secondColumn?: null | {
		images?: null | Array<{
			video?: null | {
				src?: null | string
			}
			image?: null | {
				src: string
				width: number
				height: number
				aspectRatio: number
			}
			mobileImage?: null | {
				src: string
				width: number
				height: number
				aspectRatio: number
			}
		}>
		isSwiper?: null | boolean
	}
	mergeColumns?: null | boolean
	createdAtS?: null | number
}

/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IModelConfig, IModelSchemaConfig } from "@fd-lib/orm/db/getModelConfig"
import * as ak from "arktype"
export const BrandSchemaConfig = {
	tableName: "Brand",
	primaryKeyType: "uuid",
	properties: {
		id: {
			type: "string",
			id: "id",
			label: "Id",
			inputFieldType: "text",
			isRequired: true
		},
		serviceId: {
			type: "string",
			id: "serviceId",
			label: "Service",
			useInCreateForm: true,
			ui: { createForm: true, showInDataGrid: true, displayOrder: 1 },
			isRequired: true,
			isNullable: false,
			relation: {
				type: "BelongsTo",
				otherModelType: "Service",
				joinAs: "service",
				via: "id"
			}
		},
		brandMainImage: {
			type: "object",
			useInCreateForm: true,
			isRequired: true,
			id: "brandMainImage",
			ui: {
				createForm: true,
				showInDataGrid: true,
				displayOrder: 2
			},
			label: "Brand Main Image",
			fields: {
				src: {
					type: "string",
					id: "src",

					isRequired: true
				},
				width: {
					type: "number",
					id: "width",
					isRequired: true
				},
				height: {
					type: "number",
					id: "height",
					isRequired: true
				},
				aspectRatio: {
					type: "number",
					id: "aspectRatio",
					isRequired: true
				}
			}
		},
		serviceName: {
			type: "string",
			id: "serviceName",
			label: "Service Name",
			useInCreateForm: true,
			ui: { createForm: true, showInDataGrid: true, displayOrder: 3 },
			isRequired: true
		},
		serviceType: {
			type: "string",
			useInCreateForm: true,
			id: "serviceType",
			label: "Service Type",
			ui: { createForm: true, showInDataGrid: true, displayOrder: 4 },
			isRequired: true
		},
		serviceReleaseDate: {
			type: "string",
			useInCreateForm: true,
			id: "serviceReleaseDate",
			label: "Service Release Date",
			ui: { createForm: true, showInDataGrid: true, displayOrder: 5 },
			isRequired: true
		},
		titleHTML: {
			type: "string",
			id: "titleHTML",
			useInCreateForm: true,
			label: "Title HTML",
			ui: {
				createForm: true,
				showInDataGrid: false,
				displayOrder: 6
				// editorName: "WYSIWYG"
			},
			isRequired: false
		},
		mobileTitleHTML: {
			type: "string",
			id: "mobileTitleHTML",
			useInCreateForm: true,
			label: "Mobile Title HTML",
			ui: {
				createForm: true,
				showInDataGrid: false,
				displayOrder: 7
				// editorName: "WYSIWYG"
			},
			isRequired: false
		},
		order: {
			type: "number",
			id: "order",
			useInCreateForm: true,
			label: "Order",
			ui: { createForm: true, showInDataGrid: true, displayOrder: 0 },
			isRequired: true,
			isNullable: false
		},
		description: {
			type: "string",
			id: "description",
			useInCreateForm: true,
			label: "Description",
			ui: {
				createForm: true,
				showInDataGrid: false,
				displayOrder: 8
				// editorName: "WYSIWYG"
			},
			isRequired: true
		},
		tags: {
			type: "Array<object>",
			id: "tags",
			useInCreateForm: true,
			label: "Tags",
			ui: { createForm: true, showInDataGrid: false, displayOrder: 7 },
			isRequired: false,
			isNullable: true,
			fields: {
				tag: {
					type: "string",
					id: "tag",
					label: "Tag",
					isRequired: true
				},
				isSelected: {
					type: "boolean",
					id: "isSelected",
					label: "Is Selected",
					isRequired: false
				}
			}
		},
		firstColumn: {
			type: "object",
			id: "firstColumn",
			label: "First Column",
			ui: { createForm: true, showInDataGrid: false, displayOrder: 8 },
			isRequired: false,
			useInCreateForm: true,
			isNullable: true,
			fields: {
				images: {
					type: "Array<object>",
					id: "images",
					useInCreateForm: true,
					label: "Images",
					ui: { createForm: true, showInDataGrid: false, displayOrder: 8 },
					isRequired: false,
					isNullable: true,
					fields: {
						image: {
							type: "object",
							id: "image",
							label: "Image",
							ui: {
								editorName: "Image"
							},
							isRequired: false,
							fields: {
								src: {
									type: "string",
									id: "src",
									isRequired: true
								},
								width: {
									type: "number",
									id: "width",
									isRequired: true
								},
								height: {
									type: "number",
									id: "height",
									isRequired: true
								},
								aspectRatio: {
									type: "number",
									id: "aspectRatio",
									isRequired: true
								}
							}
						},
						mobileImage: {
							type: "object",
							id: "mobileImage",
							label: "Mobile Image",
							ui: {
								editorName: "Image"
							},
							isRequired: false,
							fields: {
								src: {
									type: "string",
									id: "src",
									isRequired: true
								},
								width: {
									type: "number",
									id: "width",
									isRequired: true
								},
								height: {
									type: "number",
									id: "height",
									isRequired: true
								},
								aspectRatio: {
									type: "number",
									id: "aspectRatio",
									isRequired: true
								}
							}
						}
					}
				}
			}
		},
		secondColumn: {
			type: "object",
			id: "secondColumn",
			label: "Second Column Images",
			ui: { createForm: true, showInDataGrid: false, displayOrder: 8 },
			isRequired: false,
			useInCreateForm: true,

			isNullable: true,
			fields: {
				images: {
					type: "Array<object>",
					id: "images",
					useInCreateForm: true,
					label: "Images",
					ui: { createForm: true, showInDataGrid: false, displayOrder: 8 },
					isRequired: false,
					isNullable: true,
					fields: {
						video: {
							type: "object",
							id: "video",
							label: "Video",
							ui: {
								editorName: "VideoUpload"
							},
							isRequired: false,
							fields: {
								src: {
									type: "string",
									id: "src",
									isRequired: false
								}
							}
						},
						image: {
							type: "object",
							id: "image",
							label: "Image",
							ui: {
								editorName: "Image"
							},
							isRequired: false,
							fields: {
								src: {
									type: "string",
									id: "src",
									isRequired: true
								},
								width: {
									type: "number",
									id: "width",
									isRequired: true
								},
								height: {
									type: "number",
									id: "height",
									isRequired: true
								},
								aspectRatio: {
									type: "number",
									id: "aspectRatio",
									isRequired: true
								}
							}
						},
						mobileImage: {
							type: "object",
							id: "mobileImage",
							label: "Mobile Image",
							ui: {
								editorName: "Image"
							},
							isRequired: false,
							fields: {
								src: {
									type: "string",
									id: "src",
									isRequired: true
								},
								width: {
									type: "number",
									id: "width",
									isRequired: true
								},
								height: {
									type: "number",
									id: "height",
									isRequired: true
								},
								aspectRatio: {
									type: "number",
									id: "aspectRatio",
									isRequired: true
								}
							}
						}
					}
				},
				isSwiper: {
					type: "boolean",
					id: "isSwiper",
					isRequired: false,
					useInCreateForm: true,
					label: "Is Swiper",
					ui: {
						createForm: true,
						showInDataGrid: false,
						displayOrder: 1
					}
				}
			}
		},
		mergeColumns: {
			type: "boolean",
			id: "mergeColumns",
			isRequired: false,
			useInCreateForm: true,
			label: "Merge Columns",
			ui: {
				createForm: true,
				showInDataGrid: false,
				displayOrder: 2
			}
		},
		createdAtS: {
			type: "number",
			isRequired: false,
			isNullable: false,
			id: "createdAtS",
			label: "Created At S"
		}
	}
} satisfies IModelSchemaConfig
export const // eslint-disable-next-line no-type-assertion/no-type-assertion
	BrandArkType = ak.type<any>({
		id: "string",
		serviceId: "string",
		brandMainImage: ak.type<any>({
			src: "string",
			width: "number",
			height: "number",
			aspectRatio: "number"
		}),
		serviceName: "string",
		serviceType: "string",
		serviceReleaseDate: "string",
		"titleHTML?": "null | string",
		"mobileTitleHTML?": "null | string",
		order: "number",
		description: "string",
		"tags?": ak
			.type<any>({
				tag: "string",
				"isSelected?": "null | boolean"
			})
			.array()
			.or(ak.type.null),
		"firstColumn?": ak
			.type<any>({
				"images?": ak
					.type<any>({
						"image?": ak
							.type<any>({
								src: "string",
								width: "number",
								height: "number",
								aspectRatio: "number"
							})
							.or(ak.type.null),
						"mobileImage?": ak
							.type<any>({
								src: "string",
								width: "number",
								height: "number",
								aspectRatio: "number"
							})
							.or(ak.type.null)
					})
					.array()
					.or(ak.type.null)
			})
			.or(ak.type.null),
		"secondColumn?": ak
			.type<any>({
				"images?": ak
					.type<any>({
						"video?": ak.type<any>({ "src?": "null | string" }).or(ak.type.null),
						"image?": ak
							.type<any>({
								src: "string",
								width: "number",
								height: "number",
								aspectRatio: "number"
							})
							.or(ak.type.null),
						"mobileImage?": ak
							.type<any>({
								src: "string",
								width: "number",
								height: "number",
								aspectRatio: "number"
							})
							.or(ak.type.null)
					})
					.array()
					.or(ak.type.null),
				"isSwiper?": "null | boolean"
			})
			.or(ak.type.null),
		"mergeColumns?": "null | boolean",
		"createdAtS?": "null | number"
	}) as any as ak.Type<IBrandSchema>

type IBrandColumns =
	| "id"
	| "serviceId"
	| "brandMainImage"
	| "serviceName"
	| "serviceType"
	| "serviceReleaseDate"
	| "titleHTML"
	| "mobileTitleHTML"
	| "order"
	| "description"
	| "tags"
	| "firstColumn"
	| "secondColumn"
	| "mergeColumns"
	| "createdAtS"

export interface IBrandModelConfig {
	type: "Brand"
	primaryKeyType: "uuid"
	tableName: "Brand"
	properties: typeof BrandSchemaConfig.properties
	skipAutoMigration?: boolean
	indexes?: Array<IBrandColumns>
	uniqueConstraints?: Array<[IBrandColumns, IBrandColumns]>
	displayNameProperty?: IBrandColumns
	adminUI?: IModelConfig<IBrandSchema>["adminUI"]
	arkType: ak.Type
	quickSearchFields?: Array<IBrandColumns>
}

export const BrandModelConfig = {
	tableName: "Brand",
	primaryKeyType: "uuid",
	properties: BrandSchemaConfig.properties,
	adminUI: {
		groupName: "CMS",
		tabs: {}
	},
	arkType: BrandArkType,
	type: "Brand"
} satisfies IBrandModelConfig