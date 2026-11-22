/**
 * /login and /signup. Both routes render this page with a different `mode`, so
 * React keeps the same AuthForm instance and the switch animates in place.
 * On desktop an intro column sits beside the card; phones and tablets get the card only.
 *
 * Owns the auth requests: AuthForm validates, this page calls Supabase (through
 * ./api), shows loading and errors, then redirects or asks the user to confirm
 * their email. Google uses one handler for both views.
 *
 * Who is signed in comes from useSession(). Once there's a session (already
 * signed in, just logged in, or back from Google / a confirmation link) the user is
 * sent on: to /onboarding if they haven't picked a username yet, otherwise to
 * `next`. A failed redirect (canceled, expired link…) shows its error here.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { MailCheck } from 'lucide-react'
import logoMark from '../../../docs/assets/svg/logo-mark.svg'
import { useSession } from '@/lib/useSession'
import {
  isAuthRedirectUrl,
  resolveSessionOnLoad,
  safeRedirectPath,
  signInWithEmail,
  signUpWithEmail,
  startGoogleSignIn,
} from './api'
import { AuthForm, type AuthMode, type AuthValues } from './AuthForm'
import './auth.css'

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const { session, profile, loading, profileLoading } = useSession()
  const [searchParams] = useSearchParams()
  const nextPath = safeRedirectPath(searchParams.get('next'))
  // While a redirect's session is being read, lock the form (shown on the Google button).
  const [pending, setPending] = useState<'email' | 'google' | null>(() =>
    isAuthRedirectUrl() ? 'google' : null,
  )
  const [error, setError] = useState<string | null>(null)
  /** Set after a sign up that needs email confirmation: the address the link went to. */
  const [confirmEmailFor, setConfirmEmailFor] = useState<string | null>(null)

  // Blocks a second request while one is in flight (state updates aren't synchronous).
  const inFlight = useRef(false)
  // The view a request was started from; a result that comes back after the user
  // switched views (e.g. with the back button) is dropped.
  const currentMode = useRef(mode)
  useEffect(() => {
    currentMode.current = mode
  }, [mode])

  // Signed in: continue to onboarding (no username yet) or `next`. Waits for the
  // profile so a returning user isn't sent to onboarding by mistake. If the profile
  // couldn't be loaded, onboarding shows the error with a retry.
  useEffect(() => {
    if (loading || !session || profileLoading) return
    const destination = profile?.username
      ? nextPath
      : `/onboarding${nextPath === '/' ? '' : `?next=${encodeURIComponent(nextPath)}`}`
    navigate(destination, { replace: true })
  }, [loading, session, profile, profileLoading, nextPath, navigate])

  // Back from a redirect that didn't produce a session (canceled on Google, expired
  // link…): unlock, show why, and strip the error from the URL so a refresh doesn't
  // repeat it. Successful redirects are handled by the effect above.
  useEffect(() => {
    if (!isAuthRedirectUrl()) return
    let cancelled = false
    resolveSessionOnLoad().then(({ signedIn, redirectError }) => {
      if (cancelled || signedIn) return
      setPending(null)
      if (redirectError) setError(redirectError)
      navigate(nextPath === '/' ? '.' : `.?next=${encodeURIComponent(nextPath)}`, { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [navigate, nextPath])

  // Pressing Back on Google's page can restore this page from the browser's cache with
  // the Google button still spinning; unlock it.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      inFlight.current = false
      setPending(null)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  // Switching views clears the previous view's error and confirmation screen.
  const [prevMode, setPrevMode] = useState(mode)
  if (mode !== prevMode) {
    setPrevMode(mode)
    setError(null)
    setConfirmEmailFor(null)
  }

  async function handleSubmit(values: AuthValues) {
    if (inFlight.current) return
    inFlight.current = true
    const requestMode = mode
    setPending('email')
    setError(null)

    const result = requestMode === 'login' ? await signInWithEmail(values) : await signUpWithEmail(values)

    // Signed in: stay locked; the session effect above moves on once useSession() has it.
    if (result.status === 'signed_in') return

    inFlight.current = false
    setPending(null)
    if (currentMode.current !== requestMode) return

    if (result.status === 'confirm_email') {
      setConfirmEmailFor(values.email)
    } else {
      setError(result.message)
    }
  }

  async function handleGoogle() {
    if (inFlight.current) return
    inFlight.current = true
    setPending('google')
    setError(null)

    const result = await startGoogleSignIn(nextPath)
    // On success the browser is already leaving for Google: stay locked until it does.
    if (result.status === 'error') {
      inFlight.current = false
      setPending(null)
      setError(result.message)
    }
  }

  return (
    <div className="auth">
      <div className="auth__intro">
        <p className="brand">
          <img className="brand__mark" src={logoMark} alt="" aria-hidden="true" />
          breadcrumb
        </p>
        <p className="page-title">You’ve lived here.</p>
        <p className="page-sub">Have you explored it?</p>
        <ol className="stops">
          <li className="stop">
            <span className="num-ring">1</span>
            <div>
              <p className="stop__name">Pick a trail</p>
              <p className="stop__place">Short outings around Boston, made by students.</p>
            </div>
          </li>
          <li className="stop">
            <span className="num-ring">2</span>
            <div>
              <p className="stop__name">Get there</p>
              <p className="stop__place">By T, bus, bike, or on foot.</p>
            </div>
          </li>
          <li className="stop">
            <span className="num-ring">3</span>
            <div>
              <p className="stop__name">Check off crumbs</p>
              <p className="stop__place">Then rate it for the next person.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Kept mounted while hidden so the typed email survives "Use a different email". */}
      <div hidden={confirmEmailFor !== null}>
        <AuthForm mode={mode} pending={pending} error={error} onSubmit={handleSubmit} onGoogle={handleGoogle} />
      </div>
      {confirmEmailFor !== null && (
        <CheckInbox email={confirmEmailFor} onUseDifferentEmail={() => setConfirmEmailFor(null)} />
      )}
    </div>
  )
}

/** Shown after sign up when the project requires email confirmation. */
function CheckInbox({ email, onUseDifferentEmail }: { email: string; onUseDifferentEmail: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Move focus to the new heading so screen readers announce the change.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section className="auth-card" aria-labelledby="check-inbox-title">
      <header className="auth-card__head">
        <span className="auth-card__icon" aria-hidden="true">
          <MailCheck />
        </span>
        <p className="eyebrow">Almost there</p>
        <h1 id="check-inbox-title" ref={titleRef} tabIndex={-1} className="font-title auth-card__title">
          Check your inbox
        </h1>
        <p className="auth-card__sub">
          We sent a confirmation link to <b className="auth-card__email">{email}</b>. Open it to finish
          setting up your account.
        </p>
      </header>
      <p className="auth-card__note">
        Not there after a few minutes? Check your spam folder. If you already have an account with this
        email, log in instead.
      </p>
      <Link className="btn btn--block" to="/login">
        Back to log in
      </Link>
      <p className="auth-switch">
        Wrong email?{' '}
        <button type="button" className="auth-link" onClick={onUseDifferentEmail}>
          Use a different one
        </button>
      </p>
    </section>
  )
}
