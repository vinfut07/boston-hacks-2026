/**
 * Log in / sign up card. One component for both views so switching between
 * /login and /signup keeps the typed email and animates instead of remounting.
 *
 * UI only: it validates input and reports through props. The auth requests
 * (Supabase) are wired in by the caller via `onSubmit` / `onGoogle`, which also
 * drive the `pending` and `error` states.
 */
import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'

export type AuthMode = 'login' | 'signup'
export type AuthValues = { email: string; password: string }

type AuthFormProps = {
  mode: AuthMode
  /** Which request is in flight. Locks the form and shows a spinner on that button. */
  pending?: 'email' | 'google' | null
  /** Message from a failed request, shown above the form. */
  error?: string | null
  /** Called with trimmed, validated values. */
  onSubmit?: (values: AuthValues) => void
  onGoogle?: () => void
}

type Field = 'email' | 'password' | 'confirmPassword'
type Values = Record<Field, string>
type FieldErrors = Partial<Record<Field, string>>

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_ORDER: Field[] = ['email', 'password', 'confirmPassword']

const COPY = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Log in',
    sub: 'Pick up the trails you saved.',
    google: 'Sign in with Google',
    submit: 'Log in',
    submitting: 'Logging in…',
    switchPrompt: 'New to Breadcrumb?',
    switchLabel: 'Create an account',
    switchTo: '/signup',
  },
  signup: {
    eyebrow: 'New here',
    title: 'Create an account',
    sub: 'Save trails, check off crumbs, and rate the ones you finish.',
    google: 'Sign up with Google',
    submit: 'Create account',
    submitting: 'Creating account…',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Log in',
    switchTo: '/login',
  },
} as const

function validate(mode: AuthMode, values: Values): FieldErrors {
  const errors: FieldErrors = {}
  const email = values.email.trim()

  if (!email) errors.email = 'Enter your email.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'That doesn’t look like an email address.'

  if (!values.password) {
    errors.password = mode === 'login' ? 'Enter your password.' : 'Choose a password.'
  } else if (mode === 'signup' && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (mode === 'signup') {
    if (!values.confirmPassword) errors.confirmPassword = 'Re-enter your password.'
    else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords don’t match.'
  }
  return errors
}

const EMPTY_VALUES: Values = { email: '', password: '', confirmPassword: '' }

export function AuthForm({ mode, pending = null, error = null, onSubmit, onGoogle }: AuthFormProps) {
  const id = useId()
  const copy = COPY[mode]
  const busy = pending !== null

  const [values, setValues] = useState<Values>(EMPTY_VALUES)
  const [showPassword, setShowPassword] = useState(false)
  // Errors show for a field once it's been left with something typed, or after a submit attempt.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  // Switching views keeps the email but clears passwords and validation.
  const [prevMode, setPrevMode] = useState(mode)
  if (mode !== prevMode) {
    setPrevMode(mode)
    setValues((v) => ({ ...EMPTY_VALUES, email: v.email }))
    setShowPassword(false)
    setTouched({})
    setSubmitted(false)
  }

  const errors = validate(mode, values)
  const visibleError = (field: Field) => (submitted || touched[field] ? errors[field] : undefined)

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: event.target.value }))

  const markTouched = (field: Field) => () => {
    if (values[field]) setTouched((t) => ({ ...t, [field]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setSubmitted(true)

    const firstInvalid = FIELD_ORDER.find((field) => errors[field])
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid)
      if (input instanceof HTMLInputElement) input.focus()
      return
    }
    onSubmit?.({ email: values.email.trim(), password: values.password })
  }

  const ids = {
    email: `${id}-email`,
    password: `${id}-password`,
    confirmPassword: `${id}-confirm`,
    alert: `${id}-alert`,
  }

  /** aria-invalid + aria-describedby pointing at AuthField's hint/error line. */
  const describedBy = (field: Field, hasHint = false) => {
    const invalid = Boolean(visibleError(field))
    return {
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid || hasHint ? `${ids[field]}-message` : undefined,
    }
  }

  return (
    <section className="auth-card" aria-labelledby={`${id}-title`}>
      <header className="auth-card__head">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id={`${id}-title`} className="font-title auth-card__title">
          {copy.title}
        </h1>
        <p className="auth-card__sub">{copy.sub}</p>
      </header>

      <form
        className="auth-form"
        noValidate
        onSubmit={handleSubmit}
        aria-describedby={error ? ids.alert : undefined}
        aria-busy={busy}
      >
        {error && (
          <p id={ids.alert} className="auth-alert" role="alert">
            <CircleAlert aria-hidden />
            {error}
          </p>
        )}

        <button type="button" className="btn btn--secondary btn--block" onClick={onGoogle} disabled={busy}>
          {pending === 'google' ? <LoaderCircle className="auth-spin" aria-hidden /> : <GoogleMark />}
          {copy.google}
        </button>

        <p className="auth-divider">or use email</p>

        <AuthField id={ids.email} label="Email" error={visibleError('email')}>
          <input
            id={ids.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@school.edu"
            required
            value={values.email}
            onChange={update('email')}
            onBlur={markTouched('email')}
            disabled={busy}
            {...describedBy('email')}
          />
        </AuthField>

        <AuthField
          id={ids.password}
          label="Password"
          error={visibleError('password')}
          hint={mode === 'signup' ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
          aside={
            mode === 'login' && (
              <Link className="auth-link" to="/forgot-password">
                Forgot password?
              </Link>
            )
          }
        >
          <input
            id={ids.password}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
            value={values.password}
            onChange={update('password')}
            onBlur={markTouched('password')}
            disabled={busy}
            {...describedBy('password', mode === 'signup')}
          />
          <button
            type="button"
            className="auth-input__toggle"
            aria-label="Show password"
            aria-pressed={showPassword}
            aria-controls={mode === 'signup' ? `${ids.password} ${ids.confirmPassword}` : ids.password}
            onClick={() => setShowPassword((s) => !s)}
            disabled={busy}
          >
            {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </button>
        </AuthField>

        <div className="auth-collapse" data-open={mode === 'signup' || undefined} inert={mode !== 'signup'}>
          <div>
            <AuthField id={ids.confirmPassword} label="Confirm password" error={visibleError('confirmPassword')}>
              <input
                id={ids.confirmPassword}
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required={mode === 'signup'}
                value={values.confirmPassword}
                onChange={update('confirmPassword')}
                onBlur={markTouched('confirmPassword')}
                disabled={busy}
                {...describedBy('confirmPassword')}
              />
            </AuthField>
          </div>
        </div>

        <button type="submit" className="btn btn--block" disabled={busy}>
          {pending === 'email' && <LoaderCircle className="auth-spin" aria-hidden />}
          {pending === 'email' ? copy.submitting : copy.submit}
        </button>

        <p className="auth-switch">
          {copy.switchPrompt}{' '}
          <Link className="auth-link" to={copy.switchTo}>
            {copy.switchLabel}
          </Link>
        </p>
      </form>
    </section>
  )
}

type AuthFieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  aside?: ReactNode
  /** The <input> (and optional toggle). Give the input `describedBy(field)` from AuthForm. */
  children: ReactNode
}

/** Label + bordered input box + hint or error (rendered as `${id}-message`). */
export function AuthField({ id, label, error, hint, aside, children }: AuthFieldProps) {
  const messageId = `${id}-message`
  return (
    <div className="auth-field">
      <div className="auth-field__head">
        <label className="auth-field__label" htmlFor={id}>
          {label}
        </label>
        {aside}
      </div>
      <div className="auth-input" data-invalid={error ? '' : undefined}>
        {children}
      </div>
      {error ? (
        <p id={messageId} className="auth-field__error">
          <CircleAlert aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="auth-field__hint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/**
 * Google's multicolor "G". Google's sign-in branding guidelines require the
 * official mark in its own colors, so these fills are the one exception to the
 * "tokens only" rule (and to "orange is the only accent").
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
