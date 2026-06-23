import { api, clone, mockDelay } from '@/services/api'
import { deliveryConfig, zones } from '@/services/mock/data'
import type { DeliveryConfig, Zone } from '@/types/common.types'

export const deliveryApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Zones ─────────────────────────────────────────────────────────────────
    getZones: build.query<Zone[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(zones) }
      },
      providesTags: ['Zone'],
    }),

    saveZone: build.mutation<Zone, Partial<Zone> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = zones.findIndex((z) => z.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          zones[idx] = { ...zones[idx], ...payload } as Zone
          return { data: clone(zones[idx]) }
        }
        const created: Zone = {
          id: `z${Date.now()}`,
          name: payload.name ?? 'New Zone',
          etaMins: payload.etaMins ?? 12,
          areas: payload.areas ?? [],
          mapLink: payload.mapLink ?? '',
          geofence: payload.geofence ?? [],
          active: payload.active ?? true,
        }
        zones.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Zone'],
    }),

    toggleZone: build.mutation<Zone, string>({
      async queryFn(id) {
        await mockDelay(150)
        const z = zones.find((x) => x.id === id)
        if (!z) return { error: { status: 404, data: 'Not found' } as never }
        z.active = !z.active
        return { data: clone(z) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          deliveryApi.util.updateQueryData('getZones', undefined, (draft) => {
            const z = draft.find((x) => x.id === id)
            if (z) z.active = !z.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteZone: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = zones.findIndex((z) => z.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        zones.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Zone'],
    }),

    // ── Delivery fee config ────────────────────────────────────────────────────
    getDeliveryConfig: build.query<DeliveryConfig, void>({
      async queryFn() {
        await mockDelay(200)
        return { data: clone(deliveryConfig) }
      },
      providesTags: ['Delivery'],
    }),

    saveDeliveryConfig: build.mutation<DeliveryConfig, DeliveryConfig>({
      async queryFn(payload) {
        await mockDelay(350)
        deliveryConfig.freeAbove = payload.freeAbove
        deliveryConfig.tiers = payload.tiers
          .filter((t) => !Number.isNaN(t.minOrder) && !Number.isNaN(t.fee))
          .sort((a, b) => a.minOrder - b.minOrder)
        return { data: clone(deliveryConfig) }
      },
      invalidatesTags: ['Delivery'],
    }),
  }),
})

export const {
  useGetZonesQuery,
  useSaveZoneMutation,
  useToggleZoneMutation,
  useDeleteZoneMutation,
  useGetDeliveryConfigQuery,
  useSaveDeliveryConfigMutation,
} = deliveryApi
