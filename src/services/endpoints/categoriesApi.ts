import { api, clone, mockDelay } from '@/services/api'
import { categories, categoryGroups, products } from '@/services/mock/data'
import type { Category, CategoryGroup } from '@/types/common.types'

/** Live product count per category (so the number matches the real catalog). */
function withCounts(list: Category[]): Category[] {
  return list.map((c) => ({ ...c, productCount: products.filter((p) => p.category === c.name).length }))
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(withCounts(categories)) }
      },
      providesTags: ['Category'],
    }),

    toggleCategory: build.mutation<Category, string>({
      async queryFn(id) {
        await mockDelay(150)
        const category = categories.find((c) => c.id === id)
        if (!category) return { error: { status: 404, data: 'Not found' } as never }
        category.active = !category.active
        return { data: clone(category) }
      },
      // Flip the UI immediately; roll back only if the request fails.
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
            const category = draft.find((c) => c.id === id)
            if (category) category.active = !category.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    saveCategory: build.mutation<Category, Partial<Category> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = categories.findIndex((c) => c.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          categories[idx] = { ...categories[idx], ...payload } as Category
          return { data: clone(categories[idx]) }
        }
        const group = payload.group ?? 'Grocery & Kitchen'
        const created: Category = {
          id: `c${Date.now()}`,
          name: payload.name ?? 'New Category',
          group,
          emoji: payload.emoji || '📦',
          image: payload.image ?? '',
          productCount: 0,
          position: categories.filter((c) => c.group === group).length + 1,
          active: payload.active ?? true,
        }
        categories.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Category'],
    }),

    deleteCategory: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = categories.findIndex((c) => c.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        categories.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Category'],
    }),

    /** Reorder a category up/down within its group. */
    moveCategory: build.mutation<Category[], { id: string; direction: 'up' | 'down' }>({
      async queryFn({ id, direction }) {
        await mockDelay(150)
        const cat = categories.find((c) => c.id === id)
        if (!cat) return { error: { status: 404, data: 'Not found' } as never }
        const siblings = categories
          .filter((c) => c.group === cat.group)
          .sort((a, b) => a.position - b.position)
        const i = siblings.findIndex((c) => c.id === id)
        const j = direction === 'up' ? i - 1 : i + 1
        if (j >= 0 && j < siblings.length) {
          const a = siblings[i]
          const b = siblings[j]
          const tmp = a.position
          a.position = b.position
          b.position = tmp
        }
        return { data: clone(categories) }
      },
      invalidatesTags: ['Category'],
    }),

    // ── Category groups ───────────────────────────────────────────────────────
    getCategoryGroups: build.query<CategoryGroup[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...categoryGroups].sort((a, b) => a.position - b.position)) }
      },
      providesTags: ['Category'],
    }),

    saveCategoryGroup: build.mutation<CategoryGroup, Partial<CategoryGroup> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const group = categoryGroups.find((g) => g.id === payload.id)
          if (!group) return { error: { status: 404, data: 'Not found' } as never }
          const oldName = group.name
          Object.assign(group, payload)
          // Renaming a group cascades to all its categories.
          if (payload.name && payload.name !== oldName) {
            categories.forEach((c) => {
              if (c.group === oldName) c.group = payload.name as string
            })
          }
          return { data: clone(group) }
        }
        const created: CategoryGroup = {
          id: `g${Date.now()}`,
          name: payload.name ?? 'New Group',
          position: categoryGroups.length + 1,
          active: payload.active ?? true,
        }
        categoryGroups.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Category'],
    }),

    deleteCategoryGroup: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const group = categoryGroups.find((g) => g.id === id)
        if (!group) return { error: { status: 404, data: 'Not found' } as never }
        const count = categories.filter((c) => c.group === group.name).length
        if (count > 0) {
          return { error: { status: 409, data: `Group has ${count} categories` } as never }
        }
        categoryGroups.splice(categoryGroups.indexOf(group), 1)
        return { data: { id } }
      },
      invalidatesTags: ['Category'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useToggleCategoryMutation,
  useSaveCategoryMutation,
  useDeleteCategoryMutation,
  useMoveCategoryMutation,
  useGetCategoryGroupsQuery,
  useSaveCategoryGroupMutation,
  useDeleteCategoryGroupMutation,
} = categoriesApi
