// Helpers de formatage purs, partagés entre écrans.

// Date courte FR : 19/06/2026.
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
