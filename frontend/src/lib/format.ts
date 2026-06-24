// Helpers de formatage purs, partagés entre écrans.

// Date courte FR : 19/06/2026.
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Date + heure FR : 19/06/2026 à 14:32.
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
