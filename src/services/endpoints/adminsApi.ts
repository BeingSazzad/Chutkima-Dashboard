import { api, clone, mockDelay } from '@/services/api'
import { admins } from '@/services/mock/data'
import type { AdminUser } from '@/types/common.types'

export const adminsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdmins: build.query<AdminUser[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(admins) }
      },
      providesTags: ['Admin'],
    }),

    saveAdmin: build.mutation<AdminUser, Partial<AdminUser> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = admins.findIndex((a) => a.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          const storeIds = payload.storeIds ?? admins[idx].storeIds ?? (payload.storeId ? [payload.storeId] : (admins[idx].storeId ? [admins[idx].storeId!] : []))
          const storeId = storeIds.length > 0 ? storeIds[0] : null
          admins[idx] = { ...admins[idx], ...payload, storeId, storeIds } as AdminUser
          return { data: clone(admins[idx]) }
        }
        const now = new Date().toISOString()
        const storeIds = payload.storeIds ?? (payload.storeId ? [payload.storeId] : [])
        const storeId = storeIds.length > 0 ? storeIds[0] : null
        const created: AdminUser = {
          id: `a${Date.now()}`,
          name: payload.name ?? 'New Admin',
          email: payload.email ?? '',
          phone: payload.phone ?? '',
          role: payload.role ?? 'dispatcher',
          avatar: `https://i.pravatar.cc/120?u=chutkima-${payload.email ?? Date.now()}`,
          active: payload.active ?? true,
          storeId,
          storeIds,
          lastActiveAt: now,
          createdAt: now,
        }
        admins.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Admin'],
    }),

    toggleAdmin: build.mutation<AdminUser, string>({
      async queryFn(id) {
        await mockDelay(150)
        const a = admins.find((x) => x.id === id)
        if (!a) return { error: { status: 404, data: 'Not found' } as never }
        a.active = !a.active
        return { data: clone(a) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          adminsApi.util.updateQueryData('getAdmins', undefined, (draft) => {
            const a = draft.find((x) => x.id === id)
            if (a) a.active = !a.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteAdmin: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = admins.findIndex((a) => a.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        admins.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Admin'],
    }),
  }),
})

export const {
  useGetAdminsQuery,
  useSaveAdminMutation,
  useToggleAdminMutation,
  useDeleteAdminMutation,
} = adminsApi
