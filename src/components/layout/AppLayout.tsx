/**
 * App shell shared by every page (docs/mockups/Web-Explore + Main). Desktop header:
 * logo, Explore / Map / Saved / You nav, search box, orange "Make a trail" button
 * and the account menu (log in / log out via useSession()). Phones get a compact
 * header (logo, search toggle, account) plus the bottom tab bar with the + button
 * (hidden on /trails/:id pages, which have their own sticky Start trail bar).
 * Search sends you to Explore with ?q=…; the current route's page renders in <Outlet />.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bookmark, Compass, LogIn, LogOut, MapIcon, Plus, Search, User, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router'
import { BrandLogo } from '@/components/BrandLogo'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/useSession'

const NAV = [
  { to: '/', label: 'Explore', icon: Compass, end: true },
  { to: '/map', label: 'Map', icon: MapIcon, end: false },
  { to: '/saved', label: 'Saved', icon: Bookmark, end: false },
  { to: '/me', label: 'You', icon: User, end: false },
] as const

/** Search trails by name, place or neighborhood; submits to Explore as /?q=… */
function SearchBox({ id, autoFocus, onDone }: { id: string; autoFocus?: boolean; onDone?: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const current = pathname === '/' ? (params.get('q') ?? '') : ''
  const [value, setValue] = useState(current)
  const [lastCurrent, setLastCurrent] = useState(current)

  // Keep the box in sync when the URL's query changes (back button, "Clear search").
  if (current !== lastCurrent) {
    setLastCurrent(current)
    setValue(current)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const q = value.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
    onDone?.()
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search trails
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search trails, places, neighborhoods"
        className="h-11 w-full rounded-pill border border-line-strong bg-paper pr-4 pl-10.5 text-base text-ink outline-none placeholder:text-muted-foreground focus-visible:shadow-[var(--focus-ring)]"
      />
    </form>
  )
}

/** Two-letter initials for the avatar fallback. */
function initials(name: string) {
  const words = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Right side of the header: a Log in link, or an avatar that opens a small menu with Log out. */
function AccountMenu() {
  const { session, profile, loading, signOut } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (loading) return <div className="size-11 shrink-0" aria-hidden />

  if (!session) {
    return (
      <Link to="/login" className="btn btn--sm btn--secondary shrink-0">
        <LogIn aria-hidden />
        Log in
      </Link>
    )
  }

  const name = profile?.display_name || profile?.username || session.user.email || 'Account'

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center overflow-hidden rounded-full bg-crumb-tint text-base font-extrabold text-crumb-strong outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initials(name)
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 w-60 rounded-[var(--radius-md)] border border-line bg-white p-2 shadow-float"
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold text-ink">{name}</p>
            {profile?.username ? <p className="truncate text-sm text-muted-foreground">@{profile.username}</p> : null}
          </div>
          <Link
            role="menuitem"
            to="/me"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-medium text-ink hover:bg-paper"
          >
            <User aria-hidden className="size-4" />
            Your profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 text-left font-medium text-ink hover:bg-paper"
          >
            <LogOut aria-hidden className="size-4" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** Phone-only bottom tab bar: Explore · Map · + · Saved · You (styled by .tabbar). */
function TabBar() {
  const [explore, map, saved, you] = NAV
  const item = ({ to, label, icon: Icon, end }: (typeof NAV)[number]) => (
    <NavLink key={to} to={to} end={end} className="tabbar__item">
      <Icon aria-hidden />
      {label}
    </NavLink>
  )
  return (
    <nav aria-label="App" className="tabbar fixed inset-x-0 bottom-0 z-20 md:hidden">
      {item(explore)}
      {item(map)}
      <Link to="/make" className="tabbar__fab" aria-label="Make a trail">
        <Plus aria-hidden />
      </Link>
      {item(saved)}
      {item(you)}
    </nav>
  )
}

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false)
  // Trail pages have their own sticky Start trail bar on phones (Mobile-Detail mockup), so no tab bar there.
  const onTrailPage = useMatch('/trails/:id/*') !== null

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-[1360px] items-center gap-3 px-4 py-3 md:gap-6 md:px-6">
          <BrandLogo />

          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="inline-flex h-10 items-center rounded-pill px-3.5 text-base font-medium text-ink-2 hover:bg-paper aria-[current=page]:bg-sand aria-[current=page]:font-bold aria-[current=page]:text-ink"
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden max-w-[460px] flex-1 lg:block">
            <SearchBox id="header-search" />
          </div>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <button
              type="button"
              className={cn('icon-btn lg:hidden', searchOpen && 'is-on')}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
              aria-controls="mobile-search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              {searchOpen ? <X aria-hidden /> : <Search aria-hidden />}
            </button>
            {/* Icon-only between md and lg so the header fits on tablets. */}
            <Link to="/make" aria-label="Make a trail" className="btn btn--sm hidden px-2.5 md:inline-flex lg:px-4">
              <Plus aria-hidden />
              <span className="hidden lg:inline">Make a trail</span>
            </Link>
            <AccountMenu />
          </div>
        </div>

        {searchOpen ? (
          <div id="mobile-search" className="mx-auto w-full max-w-[1360px] px-4 pb-3 md:px-6 lg:hidden">
            <SearchBox id="mobile-search-input" autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        ) : null}
      </header>

      <main
        className={cn(
          'mx-auto w-full max-w-[1360px] flex-1 px-4 pt-5 md:px-6 md:pt-8 md:pb-12',
          onTrailPage ? 'pb-6' : 'pb-28',
        )}
      >
        <Outlet />
      </main>

      {onTrailPage ? null : <TabBar />}
    </div>
  )
}
