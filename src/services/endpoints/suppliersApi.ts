import { api, clone, mockDelay } from '@/services/api'
import { products, returnCounter, suppliers, supplierReturns } from '@/services/mock/data'
import type { ProductStatus, Supplier, SupplierReturn } from '@/types/common.types'

/** Derive stock status from quantity + the product's own low-stock threshold. */
function deriveStatus(stock: number, threshold: number): ProductStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock <= threshold) return 'low_stock'
  return 'active'
}

export interface NewReturnPayload {
  productId: string
  supplierId: string | null
  quantity: number
  reason: SupplierReturn['reason']
  comments?: string
  adminName?: string
}

export const suppliersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSuppliers: build.query<Supplier[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(suppliers) }
      },
      providesTags: ['Supplier'],
    }),

    saveSupplier: build.mutation<Supplier, Partial<Supplier> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const s = suppliers.find((x) => x.id === payload.id)
          if (!s) return { error: { status: 404, data: 'Not found' } as never }
          Object.assign(s, payload)
          return { data: clone(s) }
        }
        // Next sequential supplier code (SUP-00N).
        const maxCode = suppliers.reduce((max, s) => {
          const n = Number(s.code.replace(/\D/g, ''))
          return Number.isNaN(n) ? max : Math.max(max, n)
        }, 0)
        const created: Supplier = {
          id: `sup${Date.now()}`,
          code: payload.code || `SUP-${String(maxCode + 1).padStart(3, '0')}`,
          name: payload.name ?? 'New Supplier',
          contactPerson: payload.contactPerson ?? '',
          phone: payload.phone ?? '',
          email: payload.email ?? '',
          address: payload.address ?? '',
          panNo: payload.panNo ?? '',
          productsSupplied: payload.productsSupplied ?? '',
          notes: payload.notes ?? '',
          active: payload.active ?? true,
          createdAt: new Date().toISOString(),
        }
        suppliers.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Supplier'],
    }),

    toggleSupplier: build.mutation<Supplier, string>({
      async queryFn(id) {
        await mockDelay(150)
        const s = suppliers.find((x) => x.id === id)
        if (!s) return { error: { status: 404, data: 'Not found' } as never }
        s.active = !s.active
        return { data: clone(s) }
      },
      invalidatesTags: ['Supplier'],
    }),

    deleteSupplier: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = suppliers.findIndex((s) => s.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        suppliers.splice(idx, 1)
        // Orphan-safe: unlink any products that pointed at this supplier.
        products.forEach((p) => {
          if (p.supplierId === id) p.supplierId = null
        })
        return { data: { id } }
      },
      invalidatesTags: ['Supplier', 'Product'],
    }),

    getSupplierReturns: build.query<SupplierReturn[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(supplierReturns) }
      },
      providesTags: ['SupplierReturn'],
    }),

    /**
     * Process a Return to Supplier: record it and decrement inventory.
     * The returned quantity, reason, date and supplier are captured for
     * tracking and reporting; the product's stock + status are updated.
     */
    createSupplierReturn: build.mutation<SupplierReturn, NewReturnPayload>({
      async queryFn(payload) {
        await mockDelay(350)
        const product = products.find((p) => p.id === payload.productId)
        if (!product) return { error: { status: 404, data: 'Product not found' } as never }

        const qty = Math.max(0, Math.min(payload.quantity, product.stock))
        product.stock -= qty
        product.status = deriveStatus(product.stock, product.lowStockThreshold)

        const supplier = payload.supplierId ? suppliers.find((s) => s.id === payload.supplierId) : null
        const record: SupplierReturn = {
          id: `ret${Date.now()}`,
          reference: `RET-${String(returnCounter.next).padStart(6, '0')}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          supplierId: supplier?.id ?? null,
          supplierName: supplier?.name ?? '—',
          quantity: qty,
          reason: payload.reason,
          comments: payload.comments ?? '',
          adminName: payload.adminName || 'Admin',
          createdAt: new Date().toISOString(),
        }
        returnCounter.next += 1
        supplierReturns.unshift(record)
        return { data: clone(record) }
      },
      invalidatesTags: ['SupplierReturn', 'Product'],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useSaveSupplierMutation,
  useToggleSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierReturnsQuery,
  useCreateSupplierReturnMutation,
} = suppliersApi
