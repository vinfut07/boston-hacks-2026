/**
 * Auth for the auth lane: email/password and Google, as thin wrappers over the
 * shared Supabase client that turn its responses into the outcomes the UI cares
 * about, with plain-language error messages.
 *
 * Nothing here assumes how the project is configured: whether a session comes
 * back from signUp (email confirmation off) or not (confirmation on) is read
 * from the response itself.
 *
 * Redirects (Google, and the link in the confirmation email) all come back to
 * /login. The shared client reads the session or error out of that URL when the
 * app loads (supabase-js `detectSessionInUrl`, on by default), and the auth page
 * then forwards the user or shows the error. See resolveSessionOnLoad().
 */
import {
  isAuthApiError,
  isAuthImplicitGrantRedirectError,
  isAuthRetryableFetchError,
  isAuthWeakPasswordError,
  type AuthError,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type Credentials = { email: string; password: string }

export type AuthResult =
  /** A session exists: the user is logged in. */
  | { status: 'signed_in' }
  /** Sign up accepted, but the project requires email confirmation before logging in. */
  | { status: 'confirm_email' }
  | { status: 'error'; message: string }

export async function signInWithEmail({ email, password }: Credentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { status: 'error', message: authErrorMessage(error) }
    if (!data.session) return { status: 'error', message: GENERIC_ERROR }
    return { status: 'signed_in' }
  } catch (error) {
    return { status: 'error', message: unexpectedErrorMessage(error) }
  }
}

export async function signUpWithEmail({ email, password }: Credentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Where the confirmation link lands. Supabase only honors it if it matches the
      // project's Redirect URLs allow list; otherwise it falls back to the Site URL.
      options: { emailRedirectTo: authRedirectUrl('/') },
    })
    if (error) return { status: 'error', message: authErrorMessage(error) }
    if (data.session) return { status: 'signed_in' }
    // No session: confirmation is required. When confirmation is on, Supabase also answers
    // this way for an email that's already registered (so accounts can't be probed), and the
    // confirmation screen covers both cases.
    return { status: 'confirm_email' }
  } catch (error) {
    return { status: 'error', message: unexpectedErrorMessage(error) }
  }
}

// ---- Google (OAuth) ------------------------------------------------------------

export type GoogleStartResult = { status: 'redirecting' } | { status: 'error'; message: string }

/**
 * Sends the browser to Google through Supabase. One flow for both views: Supabase
 * creates the account on first use and logs in after that. On success the page
 * unloads; Google then returns to /login, carrying `next` so the user ends up
 * where they were headed.
 */
export async function startGoogleSignIn(next: string): Promise<GoogleStartResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl(next) },
    })
    if (error) return { status: 'error', message: authErrorMessage(error) }
    return { status: 'redirecting' }
  } catch (error) {
    return { status: 'error', message: unexpectedErrorMessage(error) }
  }
}

/** Absolute /login URL that auth redirects return to, keeping a safe `next`. */
function authRedirectUrl(next: string): string {
  const url = new URL('/login', window.location.origin)
  const safeNext = safeRedirectPath(next)
  if (safeNext !== '/') url.searchParams.set('next', safeNext)
  return url.toString()
}

// ---- Returning from a redirect -------------------------------------------------

const REDIRECT_PARAMS = ['access_token', 'error', 'error_code', 'error_description']

/**
 * Whether the current URL carries an auth redirect's result: tokens (removed by
 * supabase-js as soon as it has read them) or an error (which supabase-js leaves
 * in place, so it can still be read once the page is up).
 */
export function isAuthRedirectUrl(href: string = window.location.href): boolean {
  const url = new URL(href)
  const hash = new URLSearchParams(url.hash.slice(1))
  return REDIRECT_PARAMS.some((key) => url.searchParams.has(key) || hash.has(key))
}

/**
 * Waits for the shared client to finish loading the session (including one handed
 * back in the URL by Google or a confirmation link), then reports whether the user
 * is signed in and, if the current URL is a failed redirect, why.
 */
export async function resolveSessionOnLoad(): Promise<{ signedIn: boolean; redirectError: string | null }> {
  const fromRedirect = isAuthRedirectUrl()
  try {
    // initialize() returns the result of the client's first load, URL errors included.
    const { error } = await supabase.auth.initialize()
    const { data } = await supabase.auth.getSession()
    const redirectError = fromRedirect && error ? redirectErrorMessage(error) : null
    return { signedIn: Boolean(data.session), redirectError }
  } catch (error) {
    return { signedIn: false, redirectError: fromRedirect ? unexpectedErrorMessage(error) : null }
  }
}

/** Message for an error handed back in the redirect URL. Exported for tests. */
export function redirectErrorMessage(error: AuthError): string {
  const details = isAuthImplicitGrantRedirectError(error) ? error.details : null
  if (details?.error === 'access_denied' && details.code !== 'otp_expired') {
    return 'Google sign-in was canceled. Try again whenever you’re ready.'
  }
  if (details?.code === 'otp_expired') {
    return 'That link has expired or was already used. Log in, or sign up again for a new one.'
  }
  return 'We couldn’t finish signing you in. Please try again.'
}

// ---- Errors --------------------------------------------------------------------

const GENERIC_ERROR = 'Something went wrong on our end. Please try again.'
const NETWORK_ERROR = 'We couldn’t reach Breadcrumb. Check your connection and try again.'

/** Plain-language message for a Supabase Auth error. Exported for tests. */
export function authErrorMessage(error: AuthError): string {
  // supabase-js uses this class for both a failed request (status 0) and 5xx responses.
  if (isAuthRetryableFetchError(error)) return error.status === 0 ? NETWORK_ERROR : GENERIC_ERROR

  if (isAuthWeakPasswordError(error)) {
    const reasons = error.reasons ?? []
    if (reasons.includes('pwned')) {
      return 'That password has shown up in a data breach. Choose a different one.'
    }
    if (reasons.includes('characters')) {
      return 'That password is too simple. Mix in uppercase letters, numbers, or symbols.'
    }
    return 'That password is too short. Choose a longer one.'
  }

  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check them and try again.'
    case 'email_not_confirmed':
      return 'Confirm your email first. Open the link we sent to your inbox, then log in.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Log in instead.'
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return 'We can’t use that email address. Try a different one.'
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Signing up with email isn’t available right now.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a few minutes, then try again.'
  }

  if (isAuthApiError(error) && error.status === 429) {
    return 'Too many attempts. Wait a few minutes, then try again.'
  }
  return GENERIC_ERROR
}

function unexpectedErrorMessage(error: unknown): string {
  // fetch() rejects with a TypeError when the network is down or the request is blocked.
  return error instanceof TypeError ? NETWORK_ERROR : GENERIC_ERROR
}

/**
 * Where to go after logging in: the `next` query param if it's a path inside this app,
 * otherwise home. Rejects absolute and protocol-relative URLs so the param can't be
 * used to send people to another site, and never sends them back to an auth page.
 */
export function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  const path = next.split(/[?#]/)[0]
  if (path === '/login' || path === '/signup') return '/'
  return next
}
