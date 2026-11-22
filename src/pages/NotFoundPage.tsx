/**
 * 404 page shown for any URL that doesn't match a route in App.tsx.
 */

import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">This quest doesn&apos;t exist</h1>
      <Button asChild variant="outline">
        <Link to="/">Back home</Link>
      </Button>
    </section>
  )
}
