/**
 * "You" page. /me is the signed-in user (sent to /login or /onboarding first if
 * needed); /u/:username is anyone. Shows avatar, name, university, bio, stats
 * with the questgiver rating, then the trail tabs (ProfileTrails.tsx). Layout
 * follows docs/mockups/Mobile-Profile.dc.html.
 * Route: /me and /u/:username · Owner: Gio
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { CircleAlert, Settings, Star } from 'lucide-react'
import emptyTrail from '../../../docs/assets/svg/empty-trail.svg'
import { useSession } from '@/lib/useSession'
import {
  countMade,
  countMyFinished,
  getProfile,
  getQuestgiverRating,
  type PublicProfile,
  type QuestgiverRating,
} from './api'
import { ProfileTrails } from './ProfileTrails'
import './profile.css'

export function ProfilePage() {
  const { username } = useParams()
  const { session, profile: myProfile, loading, profileLoading } = useSession()
  const myId = session?.user.id ?? null

  if (username) {
    // Keyed so moving between two profiles starts fresh.
    return <ProfileView key={username} by={{ username }} viewerId={myId} />
  }

  // /me
  if (loading || (myId && profileLoading)) return <ProfileSkeleton />
  if (!myId) return <Navigate to="/login?next=%2Fme" replace />
  if (!myProfile?.username) return <Navigate to="/onboarding?next=%2Fme" replace />
  return <ProfileView key={myId} by={{ id: myId }} viewerId={myId} />
}

type HeaderData = {
  profile: PublicProfile
  rating: QuestgiverRating | null
  made: number | null
  finished: number | null
}

type LoadState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: HeaderData }

function ProfileView({ by, viewerId }: { by: { id: string } | { username: string }; viewerId: string | null }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const key = 'id' in by ? `id:${by.id}` : `u:${by.username}`

  useEffect(() => {
    let cancelled = false
    const lookup = key.startsWith('id:') ? { id: key.slice(3) } : { username: key.slice(2) }
    ;(async () => {
      const found = await getProfile(lookup)
      if (cancelled) return
      if (!found.ok) return setState({ status: 'error', message: found.message })
      if (!found.data) return setState({ status: 'not_found' })

      const profile = found.data
      const isOwn = profile.id === viewerId
      // The counts and rating fill in the header; if one fails it shows "–" rather
      // than hiding the whole profile.
      const [rating, made, finished] = await Promise.all([
        getQuestgiverRating(profile.id),
        countMade(profile.id),
        isOwn ? countMyFinished(profile.id) : Promise.resolve(null),
      ])
      if (cancelled) return
      setState({
        status: 'ready',
        data: {
          profile,
          rating: rating.ok ? rating.data : null,
          made: made.ok ? made.data : null,
          finished: finished && finished.ok ? finished.data : null,
        },
      })
    })()
    return () => {
      cancelled = true
    }
  }, [key, viewerId, attempt])

  if (state.status === 'loading') return <ProfileSkeleton />
  if (state.status === 'not_found') {
    return (
      <div className="profile">
        <div className="profile-empty">
          <img src={emptyTrail} alt="" width={240} height={160} />
          <h1 className="profile-empty__title">No one by that name</h1>
          <p>Check the spelling of the username, or find something to do instead.</p>
          <Link className="btn" to="/">
            Explore trails
          </Link>
        </div>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="profile">
        <div className="profile-error" role="alert">
          <CircleAlert aria-hidden />
          <p>{state.message}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((n) => n + 1)
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { profile, rating, made, finished } = state.data
  const isOwn = profile.id === viewerId
  const name = profile.display_name || profile.username || 'Breadcrumb explorer'

  return (
    <div className="profile">
      <header className="profile-head">
        <Avatar profile={profile} name={name} />
        <div className="profile-head__text">
          <h1 className="profile-name">{name}</h1>
          <p className="profile-sub">
            {[profile.username && `@${profile.username}`, profile.university].filter(Boolean).join(' · ')}
          </p>
        </div>
        {isOwn && (
          <Link className="icon-btn profile-head__edit" to="/onboarding?next=%2Fme" aria-label="Edit profile">
            <Settings aria-hidden />
          </Link>
        )}
      </header>

      {profile.bio && <p className="profile-bio">{profile.bio}</p>}

      <dl className="profile-stats" style={{ '--cols': isOwn ? 3 : 2 } as CSSProperties}>
        {isOwn && (
          <div>
            <dt>Finished</dt>
            <dd>{finished ?? '–'}</dd>
          </div>
        )}
        <div>
          <dt>Made</dt>
          <dd>{made ?? '–'}</dd>
        </div>
        <div>
          <dt>
            Rating<span className="sr-only"> as a trail maker</span>
          </dt>
          <dd>
            {rating ? (
              <span className="rating profile-stats__rating">
                <Star aria-hidden />
                {rating.average.toFixed(1)}
                <small>({rating.count})</small>
              </span>
            ) : (
              <span className="profile-stats__none">No ratings yet</span>
            )}
          </dd>
        </div>
      </dl>

      <ProfileTrails userId={profile.id} isOwn={isOwn} name={name} />
    </div>
  )
}

/** Photo (e.g. from Google) or initials on a soft orange circle, as in the mockup. */
function Avatar({ profile, name }: { profile: PublicProfile; name: string }) {
  const [broken, setBroken] = useState(false)
  if (profile.avatar_url && !broken) {
    return (
      <img
        className="profile-avatar"
        src={profile.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    )
  }
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  return (
    <span className="profile-avatar" aria-hidden="true">
      {initials}
    </span>
  )
}

function ProfileSkeleton() {
  return (
    <div className="profile" aria-busy="true" aria-label="Loading profile">
      <div className="profile-head">
        <span className="profile-avatar profile-skeleton" />
        <div className="profile-head__text">
          <span className="profile-skeleton profile-skeleton--line" style={{ width: '9rem' }} />
          <span className="profile-skeleton profile-skeleton--line" style={{ width: '6rem', marginTop: 8 }} />
        </div>
      </div>
      <div className="profile-stats profile-skeleton" style={{ height: 76 }} />
    </div>
  )
}
