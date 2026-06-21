import { api, clone, mockDelay } from '@/services/api'
import { contentPages, faqs, faqSections, linksConfig } from '@/services/mock/data'
import type { ContentPage, FaqItem, FaqSection } from '@/types/common.types'

/** Social + app-store links shown in the customer app / website. */
export interface AppLinks {
  facebook: string
  instagram: string
  tiktok: string
  youtube: string
  whatsapp: string
  playStore: string
  appStore: string
}

export const cmsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Content pages (T&C, Privacy, Refund, …) ──────────────────────────────
    getContentPages: build.query<ContentPage[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(contentPages) }
      },
      providesTags: ['Content'],
    }),

    saveContentPage: build.mutation<ContentPage, { id: string; title?: string; body: string }>({
      async queryFn({ id, title, body }) {
        await mockDelay(350)
        const page = contentPages.find((p) => p.id === id)
        if (!page) return { error: { status: 404, data: 'Not found' } as never }
        if (title !== undefined) page.title = title
        page.body = body
        page.updatedAt = new Date().toISOString()
        return { data: clone(page) }
      },
      invalidatesTags: ['Content'],
    }),

    // ── FAQ ──────────────────────────────────────────────────────────────────
    getFaqs: build.query<FaqItem[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...faqs].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['Faq'],
    }),

    saveFaq: build.mutation<FaqItem, Partial<FaqItem> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = faqs.findIndex((f) => f.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          faqs[idx] = { ...faqs[idx], ...payload } as FaqItem
          return { data: clone(faqs[idx]) }
        }
        const created: FaqItem = {
          id: `f${Date.now()}`,
          question: payload.question ?? '',
          answer: payload.answer ?? '',
          section: payload.section ?? 'General',
          position: faqs.length + 1,
          active: payload.active ?? true,
        }
        faqs.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Faq'],
    }),

    toggleFaq: build.mutation<FaqItem, string>({
      async queryFn(id) {
        await mockDelay(150)
        const f = faqs.find((x) => x.id === id)
        if (!f) return { error: { status: 404, data: 'Not found' } as never }
        f.active = !f.active
        return { data: clone(f) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cmsApi.util.updateQueryData('getFaqs', undefined, (draft) => {
            const f = draft.find((x) => x.id === id)
            if (f) f.active = !f.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteFaq: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = faqs.findIndex((f) => f.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        faqs.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Faq'],
    }),

    // ── FAQ sections (admins add/remove these) ────────────────────────────────
    getFaqSections: build.query<FaqSection[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...faqSections].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['FaqSection'],
    }),

    addFaqSection: build.mutation<FaqSection, string>({
      async queryFn(name) {
        await mockDelay(250)
        const trimmed = name.trim()
        if (!trimmed) return { error: { status: 400, data: 'Name required' } as never }
        if (faqSections.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
          return { error: { status: 409, data: 'Section already exists' } as never }
        }
        const created: FaqSection = { id: `fs${Date.now()}`, name: trimmed, position: faqSections.length + 1 }
        faqSections.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['FaqSection'],
    }),

    deleteFaqSection: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const section = faqSections.find((s) => s.id === id)
        if (!section) return { error: { status: 404, data: 'Not found' } as never }
        const used = faqs.filter((f) => f.section === section.name).length
        if (used > 0) return { error: { status: 409, data: `Section has ${used} FAQs` } as never }
        faqSections.splice(faqSections.indexOf(section), 1)
        return { data: { id } }
      },
      invalidatesTags: ['FaqSection'],
    }),

    // ── App & social links ────────────────────────────────────────────────────
    getLinks: build.query<AppLinks, void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(linksConfig) }
      },
      providesTags: ['Links'],
    }),

    saveLinks: build.mutation<AppLinks, AppLinks>({
      async queryFn(payload) {
        await mockDelay(300)
        Object.assign(linksConfig, payload)
        return { data: clone(linksConfig) }
      },
      invalidatesTags: ['Links'],
    }),
  }),
})

export const {
  useGetContentPagesQuery,
  useSaveContentPageMutation,
  useGetFaqsQuery,
  useSaveFaqMutation,
  useToggleFaqMutation,
  useDeleteFaqMutation,
  useGetFaqSectionsQuery,
  useAddFaqSectionMutation,
  useDeleteFaqSectionMutation,
  useGetLinksQuery,
  useSaveLinksMutation,
} = cmsApi
