import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { assetUrl } from '@/services/api';
import { cropToFile } from '@/lib/cropImage';
import Icon from '@/components/ui/Icon';

type Props = {
  currentImageUrl: string | null;  // image existante (édition), chemin /uploads/…
  onPick: (file: File | null) => void;  // image RECADRÉE prête à uploader (null = aucune)
  onClear: () => void;             // retirer l'image existante
};

const BOX = 'w-full max-w-[320px]';

// Champ photo du formulaire d'offre. Recadreur « pro » (react-easy-crop) : quand
// l'admin ajoute/change une photo, il la déplace + zoome dans un cadre carré ;
// on produit l'image recadrée (canvas) qui sera uploadée. Une image existante
// s'affiche telle quelle jusqu'à ce qu'on la change.
export default function OfferImageField({ currentImageUrl, onPick, onClear }: Props) {
  // Source en cours de recadrage (nouvelle photo choisie). null = pas d'édition de cadrage.
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  // Aperçu de l'image RECADRÉE (carré produit) → reflète le rendu final, réutilisé
  // pour l'aperçu « carte mobile » en object-cover.
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.click();

  // onPick peut changer à chaque render (vient du hook) → ref pour ne pas relancer
  // l'effet de recadrage en boucle.
  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

  // Révoque l'object URL de la source quand elle change / au démontage.
  useEffect(() => {
    if (!sourceUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  // Révoque l'object URL de l'aperçu recadré quand il change / au démontage.
  useEffect(() => {
    if (!croppedPreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(croppedPreview);
  }, [croppedPreview]);

  // Produit l'image recadrée (debounce) dès que le cadrage se stabilise :
  // remonte le fichier à uploader ET met à jour l'aperçu mobile.
  useEffect(() => {
    if (!sourceUrl || !area) return;
    const id = setTimeout(() => {
      cropToFile(sourceUrl, area)
        .then((file) => {
          onPickRef.current(file);
          setCroppedPreview(URL.createObjectURL(file));
        })
        .catch(() => { /* recadrage impossible : on laisse l'admin réessayer */ });
    }, 200);
    return () => clearTimeout(id);
  }, [sourceUrl, area]);

  const pickFile = (file: File | null) => {
    if (!file) return;
    setSourceUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPreview(null);
  };

  // Annule le recadrage en cours → revient à l'image existante (ou à rien).
  const cancelCrop = () => {
    setSourceUrl(null);
    setArea(null);
    setCroppedPreview(null);
    onPick(null);
  };

  // Retire complètement l'image (existante incluse).
  const removeAll = () => {
    setSourceUrl(null);
    setArea(null);
    setCroppedPreview(null);
    onClear();
  };

  return (
    <div className="flex flex-col gap-2.5 text-sm font-medium text-primo-gray">
      <span>
        Photo de l'offre <span className="font-normal text-primo-muted">(optionnel · JPG/PNG/WebP, 2 Mo max)</span>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          pickFile(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
        className="hidden"
      />

      {sourceUrl ? (
        // ── Mode recadrage (nouvelle photo) ──
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex flex-col gap-2.5">
            <div className={`relative aspect-square ${BOX} overflow-hidden rounded-2xl bg-primo-ink-900 ring-1 ring-primo-line`}>
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            </div>

            {/* Zoom */}
            <label className="flex items-center gap-2.5">
              <Icon name="search" size={16} className="text-primo-muted" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer accent-primo-teal"
                aria-label="Zoom"
              />
            </label>

            <p className="text-[12px] font-normal text-primo-muted">
              Déplace l'image et zoome pour cadrer ; le cadre carré sera enregistré.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-lg bg-primo-mint px-3 py-1.5 text-[13px] font-semibold text-primo-teal-strong transition hover:bg-primo-teal hover:text-white"
              >
                Changer la photo
              </button>
              <button
                type="button"
                onClick={cancelCrop}
                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-primo-slate transition hover:bg-primo-surface"
              >
                Annuler
              </button>
            </div>
          </div>

          <BannerPreview src={croppedPreview} />
        </div>
      ) : currentImageUrl ? (
        // ── Image existante (édition) : affichée telle quelle ──
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex flex-col gap-2.5">
            <div className={`relative aspect-square ${BOX} overflow-hidden rounded-2xl ring-1 ring-primo-line`}>
              <img src={assetUrl(currentImageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openPicker}
              className="rounded-lg bg-primo-mint px-3 py-1.5 text-[13px] font-semibold text-primo-teal-strong transition hover:bg-primo-teal hover:text-white"
            >
              Changer la photo
            </button>
            <button
              type="button"
              onClick={removeAll}
              className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-primo-error transition hover:bg-primo-error-soft"
            >
              Retirer
            </button>
            </div>
          </div>
          <BannerPreview src={assetUrl(currentImageUrl)} />
        </div>
      ) : (
        // ── Aucune image : zone d'ajout ──
        <button
          type="button"
          onClick={openPicker}
          className={`flex aspect-square ${BOX} flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primo-line bg-primo-surface text-primo-muted transition hover:border-primo-teal hover:bg-primo-mint/40 hover:text-primo-teal-strong`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primo-mint text-primo-teal-strong">
            <Icon name="gift" size={24} />
          </span>
          <span className="text-[13px] font-semibold">Ajouter une photo</span>
          <span className="text-[11px] font-normal">JPG / PNG / WebP · 2 Mo max</span>
        </button>
      )}
    </div>
  );
}

// Aperçu « carte mobile » : la même image recadrée affichée dans un cadre bannière
// (object-cover) → reflète le rendu réel sur mobile, mis à jour en direct.
function BannerPreview({ src }: { src: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-primo-muted">Aperçu carte mobile</span>
      <div className="relative h-[96px] w-[240px] max-w-full overflow-hidden rounded-xl ring-1 ring-primo-line">
        {src ? (
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primo-mint text-primo-teal-strong">
            <Icon name="gift" size={20} />
          </span>
        )}
      </div>
    </div>
  );
}
