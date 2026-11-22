/**
 * Route table for the whole app (React Router). Maps each URL to a page and
 * wraps pages in the shared AppLayout, inside <SessionProvider> so every page
 * can call useSession(). Each lane owns the pages its routes
 * point to; see docs/TASKS.md for who owns which route.
 */

import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthPage } from '@/features/auth/AuthPage'
import { SessionProvider } from '@/lib/SessionProvider'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { ExplorePage } from '@/features/explore/ExplorePage'
import { EditTrailPage } from '@/features/make/EditTrailPage'
import { MakeTrailPage } from '@/features/make/MakeTrailPage'
import { MapPage } from '@/features/map/MapPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SavedPage } from '@/features/saved/SavedPage'
import { ActiveTrailPage } from '@/features/trail/ActiveTrailPage'
import { RateTrailPage } from '@/features/trail/RateTrailPage'
import { TrailDetailPage } from '@/features/trail/TrailDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Central route table. Each feature team adds its routes as children of AppLayout,
 * e.g. { path: 'sidequests/:id', element: <SidequestDetailPage /> }.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Every screen's route already exists and points at its owner's page, so
      // nobody needs to edit this file to start a feature. Owners: docs/TASKS.md.
      { index: true, element: <ExplorePage /> }, // Jason
      { path: 'trails/:id', element: <TrailDetailPage /> }, // Jason
      { path: 'trails/:id/go', element: <ActiveTrailPage /> }, // Gio
      { path: 'trails/:id/rate', element: <RateTrailPage /> }, // Jason
      { path: 'trails/:id/edit', element: <EditTrailPage /> }, // Gio
      { path: 'make', element: <MakeTrailPage /> }, // Dom
      { path: 'saved', element: <SavedPage /> }, // Gio
      { path: 'me', element: <ProfilePage /> }, // Gio
      { path: 'u/:username', element: <ProfilePage /> }, // Gio
      { path: 'onboarding', element: <OnboardingPage /> }, // Gio
      { path: 'map', element: <MapPage /> }, // later (P1)
      { path: 'login', element: <AuthPage mode="login" /> }, // Gio
      { path: 'signup', element: <AuthPage mode="signup" /> }, // Gio
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
