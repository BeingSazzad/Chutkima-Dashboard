import { api, clone, mockDelay } from '@/services/api'
import { packers } from '@/services/mock/data'
import type { Packer } from '@/types/common.types'

export const packersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPackers: build.query<Packer[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(packers) }
      },
      providesTags: ['Packer'],
    }),

    savePacker: build.mutation<Packer, Partial<Packer> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const p = packers.find((x) => x.id === payload.id)
          if (!p) return { error: { status: 404, data: 'Not found' } as never }
          Object.assign(p, payload)
          return { data: clone(p) }
        }
        const created: Packer = {
          id: `pk${Date.now()}`,
          name: payload.name ?? 'New Packer',
          phone: payload.phone ?? '',
          active: payload.active ?? true,
          packedToday: 0,
          createdAt: new Date().toISOString(),
        }
        packers.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Packer'],
    }),

    togglePacker: build.mutation<Packer, string>({
      async queryFn(id) {
        await mockDelay(150)
        const p = packers.find((x) => x.id === id)
        if (!p) return { error: { status: 404, data: 'Not found' } as never }
        p.active = !p.active
        return { data: clone(p) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          packersApi.util.updateQueryData('getPackers', undefined, (draft) => {
            const p = draft.find((x) => x.id === id)
            if (p) p.active = !p.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deletePacker: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = packers.findIndex((p) => p.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        packers.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Packer'],
    }),

  }),
})

export const {
  useGetPackersQuery,
  useSavePackerMutation,
  useTogglePackerMutation,
  useDeletePackerMutation,
} = packersApi
