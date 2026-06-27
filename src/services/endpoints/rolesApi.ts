import { api, clone, mockDelay } from '@/services/api'
import { roles } from '@/services/mock/data'
import type { Role } from '@/types/common.types'

export const rolesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<Role[], void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(roles) }
      },
      providesTags: ['Role'],
    }),

    saveRole: build.mutation<Role, Partial<Role> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(250)
        if (payload.id) {
          const r = roles.find((x) => x.id === payload.id)
          if (!r) return { error: { status: 404, data: 'Not found' } as never }
          Object.assign(r, payload)
          return { data: clone(r) }
        }
        const created: Role = {
          id: `role-${Date.now().toString(36)}`,
          name: payload.name ?? 'New Role',
          description: payload.description ?? '',
          system: false,
          modules: payload.modules ?? [],
          canExport: payload.canExport ?? false,
          canExportCustomers: payload.canExportCustomers ?? false,
        }
        roles.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Role'],
    }),

    deleteRole: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(200)
        const idx = roles.findIndex((r) => r.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        if (roles[idx].system) return { error: { status: 400, data: 'Built-in roles cannot be deleted' } as never }
        roles.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Role'],
    }),
  }),
})

export const { useGetRolesQuery, useSaveRoleMutation, useDeleteRoleMutation } = rolesApi
