import { api, clone, mockDelay } from '@/services/api'
import { homeSections } from '@/services/mock/data'
import type { HomeSection } from '@/types/common.types'

export const homeFeedApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHomeSections: build.query<HomeSection[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...homeSections].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['HomeSection'],
    }),

    saveHomeSection: build.mutation<HomeSection, Partial<HomeSection> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = homeSections.findIndex((s) => s.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          homeSections[idx] = { ...homeSections[idx], ...payload } as HomeSection
          return { data: clone(homeSections[idx]) }
        }
        const created: HomeSection = {
          id: `hs${Date.now()}`,
          title: payload.title ?? 'New Section',
          type: payload.type ?? 'best_seller',
          categoryGroup: payload.categoryGroup ?? '',
          productIds: payload.productIds ?? [],
          showViewAll: payload.showViewAll ?? true,
          position: homeSections.length + 1,
          active: payload.active ?? true,
        }
        homeSections.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['HomeSection'],
    }),

    toggleHomeSection: build.mutation<HomeSection, string>({
      async queryFn(id) {
        await mockDelay(150)
        const s = homeSections.find((x) => x.id === id)
        if (!s) return { error: { status: 404, data: 'Not found' } as never }
        s.active = !s.active
        return { data: clone(s) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          homeFeedApi.util.updateQueryData('getHomeSections', undefined, (draft) => {
            const s = draft.find((x) => x.id === id)
            if (s) s.active = !s.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    /** Move a section up/down to reorder the feed. */
    moveHomeSection: build.mutation<HomeSection[], { id: string; direction: 'up' | 'down' }>({
      async queryFn({ id, direction }) {
        await mockDelay(150)
        const sorted = [...homeSections].sort((a, b) => a.position - b.position)
        const i = sorted.findIndex((s) => s.id === id)
        const j = direction === 'up' ? i - 1 : i + 1
        if (i === -1 || j < 0 || j >= sorted.length) return { data: clone(sorted) }
        const a = sorted[i]
        const b = sorted[j]
        const tmp = a.position
        a.position = b.position
        b.position = tmp
        return { data: clone([...homeSections].sort((x, y) => x.position - y.position)) }
      },
      invalidatesTags: ['HomeSection'],
    }),

    deleteHomeSection: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = homeSections.findIndex((s) => s.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        homeSections.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['HomeSection'],
    }),
  }),
})

export const {
  useGetHomeSectionsQuery,
  useSaveHomeSectionMutation,
  useToggleHomeSectionMutation,
  useMoveHomeSectionMutation,
  useDeleteHomeSectionMutation,
} = homeFeedApi
