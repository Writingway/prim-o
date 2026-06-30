import { useEffect, useMemo } from 'react';
import { assetUrl } from '@/services/api';
import Icon from '@/components/ui/Icon';

type Props = {
  imageFile: File | null;          // fichier choisi (pas encore uploadé)
  currentImageUrl: string | null;  // image existante (édition), chemin /uploads/…
  onPick: (file: File | null) => void;
  onClear: () => void;
};

// Champ photo du formulaire d'offre : aperçu (carré, object-cover) + sélection
// de fichier + retrait. Gère le cycle de vie de l'object URL de l'aperçu local.
export default function OfferImageField({ imageFile, currentImageUrl, onPick, onClear }: Props) {
  // Aperçu du fichier choisi (object URL) ; l'effet ne fait que le révoquer
  // (l'ancien) à chaque changement/démontage, sans setState.
  const filePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const preview = filePreview ?? (currentImageUrl ? assetUrl(currentImageUrl) : null);

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-primo-gray">
      Photo de l'offre <span className="font-normal text-primo-muted">(optionnel · JPG/PNG/WebP, 2 Mo max)</span>
      <div className="flex items-center gap-3">
        {preview ? (
          <img
            src={preview}
            alt=""
            className="h-16 w-16 flex-none rounded-lg object-cover ring-1 ring-primo-line"
          />
        ) : (
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-primo-mint text-primo-teal-strong ring-1 ring-primo-line">
            <Icon name="gift" size={22} />
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="text-[13px] text-primo-gray file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primo-mint file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-primo-teal-strong hover:file:bg-primo-teal hover:file:text-white"
          />
          {preview && (
            <button
              type="button"
              onClick={onClear}
              className="text-[12px] font-semibold text-primo-error hover:underline"
            >
              Retirer la photo
            </button>
          )}
        </div>
      </div>
    </label>
  );
}
