import { api, clone, mockDelay } from '@/services/api'
import { onboardingSlides } from '@/services/mock/data'
import type { OnboardingSlide } from '@/types/common.types'

export const onboardingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOnboardingSlides: build.query<OnboardingSlide[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...onboardingSlides].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['Onboarding'],
    }),

    saveOnboardingSlide: build.mutation<OnboardingSlide, Partial<OnboardingSlide> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = onboardingSlides.findIndex((s) => s.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          onboardingSlides[idx] = { ...onboardingSlides[idx], ...payload } as OnboardingSlide
          return { data: clone(onboardingSlides[idx]) }
        }
        const created: OnboardingSlide = {
          id: `ob${Date.now()}`,
          title: payload.title ?? 'New Slide',
          subtitle: payload.subtitle ?? '',
          image: payload.image ?? '',
          position: onboardingSlides.length + 1,
          active: payload.active ?? true,
        }
        onboardingSlides.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Onboarding'],
    }),

    toggleOnboardingSlide: build.mutation<OnboardingSlide, string>({
      async queryFn(id) {
        await mockDelay(150)
        const s = onboardingSlides.find((x) => x.id === id)
        if (!s) return { error: { status: 404, data: 'Not found' } as never }
        s.active = !s.active
        return { data: clone(s) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          onboardingApi.util.updateQueryData('getOnboardingSlides', undefined, (draft) => {
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

    deleteOnboardingSlide: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = onboardingSlides.findIndex((s) => s.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        onboardingSlides.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Onboarding'],
    }),
  }),
})

export const {
  useGetOnboardingSlidesQuery,
  useSaveOnboardingSlideMutation,
  useToggleOnboardingSlideMutation,
  useDeleteOnboardingSlideMutation,
} = onboardingApi
