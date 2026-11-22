/**
 * The breadcrumb wordmark: three growing orange dots + "breadcrumb", linking home.
 * Mark comes from docs/assets/svg/logo-mark.svg; styled by .brand in components.css.
 * Used by the app header (AppLayout).
 */

import { Link } from 'react-router'
import logoMark from '../../docs/assets/svg/logo-mark.svg'

export function BrandLogo() {
  return (
    <Link to="/" className="brand" aria-label="breadcrumb, home">
      <img className="brand__mark" src={logoMark} alt="" aria-hidden="true" />
      breadcrumb
    </Link>
  )
}
