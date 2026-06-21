import { api, clone, mockDelay } from '@/services/api'
import { coupons } from '@/services/mock/data'
import type { Coupon } from '@/types/common.types'

export const couponsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCoupons: build.query<Coupon[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(coupons) }
      },
      providesTags: ['Coupon'],
    }),

    saveCoupon: build.mutation<Coupon, Partial<Coupon> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = coupons.findIndex((c) => c.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          coupons[idx] = { ...coupons[idx], ...payload } as Coupon
          return { data: clone(coupons[idx]) }
        }
        const created: Coupon = {
          id: `cp${Date.now()}`,
          code: (payload.code ?? 'NEWCODE').toUpperCase(),
          description: payload.description ?? '',
          type: payload.type ?? 'percent',
          value: payload.value ?? 0,
          minOrder: payload.minOrder ?? 0,
          maxDiscount: payload.maxDiscount ?? 0,
          usageLimit: payload.usageLimit ?? 1000,
          used: 0,
          validUntil: payload.validUntil ?? new Date(Date.now() + 30 * 86_400_000).toISOString(),
          active: payload.active ?? true,
        }
        coupons.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Coupon'],
    }),

    toggleCoupon: build.mutation<Coupon, string>({
      async queryFn(id) {
        await mockDelay(150)
        const c = coupons.find((x) => x.id === id)
        if (!c) return { error: { status: 404, data: 'Not found' } as never }
        c.active = !c.active
        return { data: clone(c) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          couponsApi.util.updateQueryData('getCoupons', undefined, (draft) => {
            const c = draft.find((x) => x.id === id)
            if (c) c.active = !c.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteCoupon: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = coupons.findIndex((c) => c.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        coupons.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Coupon'],
    }),
  }),
})

export const {
  useGetCouponsQuery,
  useSaveCouponMutation,
  useToggleCouponMutation,
  useDeleteCouponMutation,
} = couponsApi
