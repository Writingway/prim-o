import { useEffect, useState } from 'react';
import { listOffers, getAdminStats, deactivateOffer, updateOffer } from '@/services/api';
import type { Offer, AdminStats } from '@/types/types';
import type { ConfirmFn } from '@/components/ui/ConfirmDialog';

type Opts = {
  confirm: ConfirmFn;
  flash: (msg: string) => void;
  onAuthExpired: () => void;
};

// Couche data du panneau Offres admin : liste + stats + activation/désactivation.
export function useAdminOffers({ confirm, flash, onAuthExpired }: Opts) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [offersRes, statsRes] = await Promise.all([listOffers(), getAdminStats()]);
      if (offersRes.ok && offersRes.data) {
        setOffers(offersRes.data.offers);
      } else if (offersRes.status === 401) {
        setError('Session expirée, reconnecte-toi.');
      } else {
        setError('Impossible de charger les offres.');
      }
      if (statsRes.ok && statsRes.data) setStats(statsRes.data);
    } catch {
      setError('Impossible de joindre le serveur. Le backend est-il lancé ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    }, []);

  // Désactivation = soft delete dédié ; réactivation = update isActive.
  const toggleActive = async (offer: Offer) => {
    const ok = await confirm({
      title: offer.isActive ? 'Désactiver cette offre ?' : 'Réactiver cette offre ?',
      message: offer.isActive
        ? `Désactiver « ${offer.partnerName} » ? Elle ne sera plus visible.`
        : `Réactiver « ${offer.partnerName} » ?`,
      confirmLabel: offer.isActive ? 'Désactiver' : 'Réactiver',
      danger: offer.isActive,
    });
    if (!ok) return;
    try {
      const res = offer.isActive
        ? await deactivateOffer(offer.id)
        : await updateOffer(offer.id, { isActive: true });
      if (res.ok) {
        flash(offer.isActive ? 'Offre désactivée.' : 'Offre réactivée.');
        reload();
      } else if (res.status === 401) {
        setError('Session expirée, reconnecte-toi.');
        onAuthExpired();
      } else {
        setError("Erreur lors de la mise à jour de l'offre.");
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    }
  };

  return { offers, stats, error, setError, loading, reload, toggleActive };
}
