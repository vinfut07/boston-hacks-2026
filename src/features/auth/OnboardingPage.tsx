/**
 * /onboarding: a new user picks a username (plus display name and university)
 * before using the app. AuthPage sends signed-in users here while
 * profile.username is empty; afterwards it doubles as "Edit profile" (the You
 * page's settings button links here). Saves with an UPDATE, refreshes the shared
 * session profile, then continues to `?next=` or home.
 */
import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useSession } from '@/lib/useSession'
import { safeRedirectPath } from './api'
import { AuthField } from './AuthForm'
import {
  DISPLAY_NAME_MAX,
  loadProfileFields,
  saveProfileFields,
  UNIVERSITY_MAX,
  USERNAME_PATTERN,
  type ProfileFields,
} from './onboarding-api'
import './auth.css'

type Field = keyof ProfileFields
type FieldErrors = Partial<Record<Field, string>>

function validate(fields: ProfileFields): FieldErrors {
  const errors: FieldErrors = {}
  const { username } = fields
  if (!username) errors.username = 'Pick a username.'
  else if (username.length < 3) errors.username = 'Use at least 3 characters.'
  else if (username.length > 30) errors.username = 'Use 30 characters or fewer.'
  else if (!USERNAME_PATTERN.test(username)) {
    errors.username = 'Use only lowercase letters, numbers, and underscores.'
  }
  if (fields.displayName.trim().length > DISPLAY_NAME_MAX) {
    errors.displayName = `Use ${DISPLAY_NAME_MAX} characters or fewer.`
  }
  if (fields.university.trim().length > UNIVERSITY_MAX) {
    errors.university = `Use ${UNIVERSITY_MAX} characters or fewer.`
  }
  return errors
}

export function OnboardingPage() {
  const { session, loading } = useSession()
  const userId = session?.user.id ?? null

  if (loading) return <OnboardingShell variant="loading" />
  // Log in first; AuthPage brings users without a username straight back here.
  if (!userId) return <Navigate to="/login" replace />
  // Keyed by user so switching accounts starts from that user's saved values.
  return <OnboardingForm key={userId} userId={userId} />
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; saved: ProfileFields }

function OnboardingForm({ userId }: { userId: string }) {
  const id = useId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useSession()
  // Never return to onboarding itself after saving.
  const next = safeRedirectPath(searchParams.get('next'))
  const nextPath = next.startsWith('/onboarding') ? '/' : next

  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [fields, setFields] = useState<ProfileFields>({ username: '', displayName: '', university: '' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Server-side username problem (taken), cleared as soon as the username changes.
  const [takenUsername, setTakenUsername] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadProfileFields(userId).then((result) => {
      if (cancelled) return
      if (result.status === 'error') {
        setLoad({ status: 'error', message: result.message })
        return
      }
      setLoad({ status: 'ready', saved: result.fields })
      setFields(result.fields)
    })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  if (load.status === 'loading') return <OnboardingShell variant="loading" />
  if (load.status === 'error') {
    return (
      <OnboardingShell variant="error">
        <p className="auth-alert" role="alert">
          <CircleAlert aria-hidden />
          {load.message}
        </p>
        <button
          type="button"
          className="btn btn--block"
          onClick={() => {
            setLoad({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
        >
          Try again
        </button>
      </OnboardingShell>
    )
  }

  // Editing an existing profile vs. choosing a username for the first time.
  const editing = load.saved.username !== ''
  const errors = validate(fields)
  if (takenUsername !== null && takenUsername === fields.username) {
    errors.username = 'That username is taken. Try another one.'
  }
  const visibleError = (field: Field) => (submitted ? errors[field] : undefined)

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement>) => {
    // Usernames are lowercase; typing capitals just works.
    const value = field === 'username' ? event.target.value.toLowerCase() : event.target.value
    setFields((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSubmitted(true)
    setFormError(null)

    const firstInvalid = (['username', 'displayName', 'university'] as const).find((f) => errors[f])
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid)
      if (input instanceof HTMLInputElement) input.focus()
      return
    }

    setSaving(true)
    const result = await saveProfileFields(userId, fields)
    if (result.status === 'saved') {
      await refreshProfile()
      navigate(nextPath, { replace: true })
      return
    }
    setSaving(false)
    if (result.field === 'username') {
      setTakenUsername(fields.username)
      const input = document.getElementById(`${id}-username`)
      if (input instanceof HTMLInputElement) input.focus()
    } else {
      setFormError(result.message)
    }
  }

  const describedBy = (field: Field, hasHint = false) => {
    const invalid = Boolean(visibleError(field))
    return {
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid || hasHint ? `${id}-${field}-message` : undefined,
    }
  }

  return (
    <OnboardingShell variant={editing ? 'edit' : 'new'}>
      <form className="auth-form" noValidate onSubmit={handleSubmit} aria-busy={saving}>
        {formError && (
          <p className="auth-alert" role="alert">
            <CircleAlert aria-hidden />
            {formError}
          </p>
        )}

        <AuthField
          id={`${id}-username`}
          label="Username"
          error={visibleError('username')}
          hint={`Your profile link: /u/${fields.username || 'username'}`}
        >
          <input
            id={`${id}-username`}
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={30}
            placeholder="maya_explores"
            required
            value={fields.username}
            onChange={update('username')}
            disabled={saving}
            {...describedBy('username', true)}
          />
        </AuthField>

        <AuthField id={`${id}-displayName`} label="Display name" error={visibleError('displayName')}>
          <input
            id={`${id}-displayName`}
            name="displayName"
            type="text"
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX}
            placeholder="Maya Chen"
            value={fields.displayName}
            onChange={update('displayName')}
            disabled={saving}
            {...describedBy('displayName')}
          />
        </AuthField>

        <AuthField
          id={`${id}-university`}
          label="University"
          error={visibleError('university')}
          hint="Optional."
        >
          <input
            id={`${id}-university`}
            name="university"
            type="text"
            autoComplete="organization"
            maxLength={UNIVERSITY_MAX}
            placeholder="Northeastern"
            value={fields.university}
            onChange={update('university')}
            disabled={saving}
            {...describedBy('university', true)}
          />
        </AuthField>

        <button type="submit" className="btn btn--block" disabled={saving}>
          {saving && <LoaderCircle className="auth-spin" aria-hidden />}
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Continue'}
        </button>

        {editing && (
          <p className="auth-switch">
            <Link className="auth-link" to="/me">
              Cancel
            </Link>
          </p>
        )}
      </form>
    </OnboardingShell>
  )
}

const SHELL_COPY = {
  loading: { eyebrow: null, title: 'Your profile', sub: null },
  error: { eyebrow: null, title: 'Your profile', sub: null },
  new: {
    eyebrow: 'Almost done',
    title: 'Pick a username',
    sub: 'It’s how people find your trails. You can change it later.',
  },
  edit: { eyebrow: 'Your profile', title: 'Edit profile', sub: 'This is how other people see you on Breadcrumb.' },
} as const

/** Card frame shared by the loading, error and form states. */
function OnboardingShell({
  variant,
  children,
}: {
  variant: keyof typeof SHELL_COPY
  children?: ReactNode
}) {
  const copy = SHELL_COPY[variant]
  return (
    <div className="auth auth--solo">
      <section className="auth-card" aria-labelledby="onboarding-title" aria-busy={variant === 'loading'}>
        <header className="auth-card__head">
          {copy.eyebrow && <p className="eyebrow">{copy.eyebrow}</p>}
          <h1 id="onboarding-title" className="font-title auth-card__title">
            {copy.title}
          </h1>
          {copy.sub && <p className="auth-card__sub">{copy.sub}</p>}
        </header>
        {variant === 'loading' ? (
          <p className="auth-card__note auth-loading">
            <LoaderCircle className="auth-spin" aria-hidden />
            Loading your profile…
          </p>
        ) : (
          children
        )}
      </section>
    </div>
  )
}
