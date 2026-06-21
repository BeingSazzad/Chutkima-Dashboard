# Chutkima — Admin Dashboard

Operations dashboard for **Chutkima**, a 10-minute q-commerce grocery delivery
service in **Butwal, Nepal**. It manages the full dark-store operation: live
orders, **driver dispatch & assignment**, products/inventory, categories,
customers, and analytics.

Built with the customer app's brand: **Plus Jakarta Sans** + the Chutkima
teal-green palette, currency in **NPR**.

## Tech stack

- **React 18 + TypeScript + Vite**
- **Redux Toolkit + RTK Query** (data layer; runs on seeded mock data so the app
  works with no backend)
- **React Router v6** (auth-guarded routes)
- **Tailwind CSS** (brand theme in `tailwind.config.js`)
- **Recharts** (charts) · **lucide-react** (icons) · **zod** (env validation)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

**Demo login:** credentials are pre-filled on the login screen — just click
*Sign in* (any non-empty email/password works in mock mode).

## Project structure

```
src/
├── main.tsx                # entry + providers
├── App.tsx                 # router outlet
├── router/                 # createBrowserRouter + PrivateRoute (auth guard)
├── pages/                  # route-level screens only
│   ├── auth/  dashboard/  orders/  products/
│   ├── categories/  drivers/  customers/  settings/
├── components/
│   ├── ui/                 # reusable design system (Button, Input, Card, Modal, Table…)
│   ├── layout/             # Sidebar, Topbar, PageHeader, DashboardLayout
│   ├── shared/             # cross-feature (Avatar, StatCard, StatusBadge, Logo…)
│   └── orders/             # feature components (AssignDriverModal, OrderJourney)
├── store/                  # configureStore, slices (auth, ui), typed hooks
├── services/
│   ├── api.ts              # RTK Query base (JWT header wired up)
│   ├── endpoints/          # orders, products, drivers, customers, categories, analytics, auth
│   └── mock/data.ts        # seeded, mutable in-memory dataset
├── hooks/                  # useAuth, useDebounce
├── lib/                    # utils (cn, formatNPR, …) + constants (status meta, zones)
├── types/                  # domain + api types
├── config/env.ts           # zod-validated env
├── constants/routes.ts     # centralized ROUTES
└── styles/index.css        # Tailwind layers
```

## Going live (swap mocks for a real API)

The data layer is already shaped for a real backend:

1. `services/api.ts` already configures `fetchBaseQuery` with the JWT bearer
   header from the auth slice and `VITE_API_BASE_URL`.
2. In each file under `services/endpoints/`, replace the `queryFn` (mock) with a
   `query` returning the request descriptor, e.g.
   `query: (filters) => ({ url: '/orders', params: filters })`.
3. Delete `services/mock/`.

## Key features

- **Dashboard** — revenue & order KPIs, 7-day revenue area chart, category-share
  donut, recent orders, riders on delivery, top sellers.
- **Orders** — status tabs, zone + search filters, **assign/reassign rider**,
  full order detail with the live **Order Journey** stepper and status advance.
- **Drivers** — fleet overview (available / on-delivery / offline), per-rider
  stats, zone-aware assignment from orders, status toggles.
- **Products** — catalog grid, filters, stock editing, add product.
- **Categories** — grouped, show/hide toggles.
- **Customers** — lifetime value, tiers, last-order recency.
- **Analytics** — revenue trend, orders-by-hour, top products.
```
