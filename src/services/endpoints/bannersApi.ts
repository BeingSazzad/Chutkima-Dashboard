import { api, clone, mockDelay } from '@/services/api'
import { banners } from '@/services/mock/data'
import type { Banner } from '@/types/common.types'

export const bannersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBanners: build.query<Banner[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...banners].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['Banner'],
    }),

    saveBanner: build.mutation<Banner, Partial<Banner> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = banners.findIndex((b) => b.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          banners[idx] = { ...banners[idx], ...payload } as Banner
          return { data: clone(banners[idx]) }
        }
        const placement = payload.placement ?? 'hero'
        const created: Banner = {
          id: `b${Date.now()}`,
          title: payload.title ?? 'New Banner',
          subtitle: payload.subtitle ?? '',
          image: payload.image ?? '',
          placement,
          position: banners.filter((b) => b.placement === placement).length + 1,
          ctaLabel: payload.ctaLabel ?? 'Shop now',
          ctaLink: payload.ctaLink ?? '/',
          active: payload.active ?? true,
        }
        banners.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Banner'],
    }),

    toggleBanner: build.mutation<Banner, string>({
      async queryFn(id) {
        await mockDelay(150)
        const b = banners.find((x) => x.id === id)
        if (!b) return { error: { status: 404, data: 'Not found' } as never }
        b.active = !b.active
        return { data: clone(b) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          bannersApi.util.updateQueryData('getBanners', undefined, (draft) => {
            const b = draft.find((x) => x.id === id)
            if (b) b.active = !b.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteBanner: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = banners.findIndex((b) => b.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        banners.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Banner'],
    }),
  }),
})

export const {
  useGetBannersQuery,
  useSaveBannerMutation,
  useToggleBannerMutation,
  useDeleteBannerMutation,
} = bannersApi
