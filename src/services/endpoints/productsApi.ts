import { api, clone, mockDelay } from '@/services/api'
import { products } from '@/services/mock/data'
import type { Product, ProductStatus } from '@/types/common.types'

interface ProductFilters {
  group?: string
  search?: string
  status?: Product['status'] | 'all'
}

/** Derive stock status from quantity + the product's own low-stock threshold. */
function deriveStatus(stock: number, threshold: number): ProductStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock <= threshold) return 'low_stock'
  return 'active'
}

export interface BulkProductRow {
  sku: string
  name: string
  brand?: string
  category?: string
  categoryGroup?: string
  price?: number
  mrp?: number
  stock?: number
  unit?: string
  shelfNo?: string
  image?: string
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<Product[], ProductFilters | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...products]
        if (filters?.group && filters.group !== 'all') {
          result = result.filter((p) => p.categoryGroup === filters.group)
        }
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((p) => p.status === filters.status)
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q),
          )
        }
        return { data: clone(result) }
      },
      providesTags: ['Product'],
    }),

    updateStock: build.mutation<Product, { id: string; stock: number }>({
      async queryFn({ id, stock }) {
        await mockDelay(250)
        const product = products.find((p) => p.id === id)
        if (!product) return { error: { status: 404, data: 'Not found' } as never }
        product.stock = stock
        product.status = deriveStatus(stock, product.lowStockThreshold)
        return { data: clone(product) }
      },
      invalidatesTags: ['Product'],
    }),

    saveProduct: build.mutation<Product, Partial<Product> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = products.findIndex((p) => p.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          const merged = { ...products[idx], ...payload } as Product
          if (payload.images) merged.image = payload.images[0] ?? ''
          merged.status = deriveStatus(merged.stock, merged.lowStockThreshold)
          products[idx] = merged
          return { data: clone(merged) }
        }
        const stock = payload.stock ?? 0
        const threshold = payload.lowStockThreshold ?? 15
        const images = payload.images ?? (payload.image ? [payload.image] : [])
        const created: Product = {
          id: `p${Date.now()}`,
          sku: payload.sku || `SKU-${Date.now().toString().slice(-5)}`,
          name: payload.name ?? 'New Product',
          brand: payload.brand ?? '—',
          category: payload.category ?? 'Uncategorized',
          categoryGroup: payload.categoryGroup ?? 'Grocery & Kitchen',
          image: images[0] ?? '',
          images,
          price: payload.price ?? 0,
          mrp: payload.mrp ?? 0,
          unit: payload.unit ?? '1 pc',
          stock,
          lowStockThreshold: threshold,
          shelfNo: payload.shelfNo ?? '',
          onClearance: payload.onClearance ?? false,
          status: deriveStatus(stock, threshold),
          deliveryMins: payload.deliveryMins ?? 15,
          sold: 0,
        }
        products.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Product'],
    }),

    deleteProduct: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = products.findIndex((p) => p.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        products.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Product'],
    }),

    /** Bulk upsert products by SKU (CSV/Excel import). Returns counts. */
    bulkImportProducts: build.mutation<{ added: number; updated: number }, BulkProductRow[]>({
      async queryFn(rows) {
        await mockDelay(500)
        let added = 0
        let updated = 0
        for (const row of rows) {
          if (!row.sku || !row.name) continue
          const existing = products.find((p) => p.sku.toLowerCase() === row.sku.toLowerCase())
          if (existing) {
            Object.assign(existing, {
              name: row.name,
              brand: row.brand ?? existing.brand,
              category: row.category ?? existing.category,
              categoryGroup: row.categoryGroup ?? existing.categoryGroup,
              price: row.price ?? existing.price,
              mrp: row.mrp ?? existing.mrp,
              stock: row.stock ?? existing.stock,
              unit: row.unit ?? existing.unit,
              shelfNo: row.shelfNo ?? existing.shelfNo,
              image: row.image ?? existing.image,
            })
            existing.status = deriveStatus(existing.stock, existing.lowStockThreshold)
            updated++
          } else {
            products.unshift({
              id: `p${Date.now()}-${added}`,
              sku: row.sku,
              name: row.name,
              brand: row.brand ?? '—',
              category: row.category ?? 'Uncategorized',
              categoryGroup: row.categoryGroup ?? 'Grocery & Kitchen',
              image: row.image ?? '',
              images: row.image ? [row.image] : [],
              price: row.price ?? 0,
              mrp: row.mrp ?? row.price ?? 0,
              unit: row.unit ?? '1 pc',
              stock: row.stock ?? 0,
              lowStockThreshold: 15,
              shelfNo: row.shelfNo ?? '',
              onClearance: false,
              status: deriveStatus(row.stock ?? 0, 15),
              deliveryMins: 15,
              sold: 0,
            })
            added++
          }
        }
        return { data: { added, updated } }
      },
      invalidatesTags: ['Product'],
    }),

    /** Bulk stock update by SKU (daily restock CSV). */
    bulkUpdateStock: build.mutation<{ updated: number; missing: string[] }, { sku: string; stock: number }[]>({
      async queryFn(rows) {
        await mockDelay(400)
        let updated = 0
        const missing: string[] = []
        for (const row of rows) {
          const p = products.find((x) => x.sku.toLowerCase() === row.sku.toLowerCase())
          if (!p) {
            missing.push(row.sku)
            continue
          }
          p.stock = row.stock
          p.status = deriveStatus(p.stock, p.lowStockThreshold)
          updated++
        }
        return { data: { updated, missing } }
      },
      invalidatesTags: ['Product'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useUpdateStockMutation,
  useSaveProductMutation,
  useDeleteProductMutation,
  useBulkImportProductsMutation,
  useBulkUpdateStockMutation,
} = productsApi
