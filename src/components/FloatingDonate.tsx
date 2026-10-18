import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';

export function FloatingDonate() {
  const { t } = useLanguage();
  return <Link className="kb-floating-donate" to="/donate" aria-label={t.donateShort} title={t.donateShort}>
    <Heart size={16} aria-hidden="true"/><span>{t.donateShort}</span>
  </Link>;
}
