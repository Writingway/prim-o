import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { assetUrl } from '@/services/api';
import { cropToFile } from '@/lib/cropImage';
import Icon from '@/components/ui/Icon';

type Props = {
  currentImageUrl: string | null;  // existing image (edit mode), /uploads/… path
  onPick: (file: File | null) => void;  // CROPPED image ready to upload (null = none)
  onClear: () => void;             // remove the existing image
};

const BOX = 'w-full max-w-[320px]';

// Photo field of the offer form. "Pro" cropper (react-easy-crop): when the admin adds
// or changes a photo, they pan + zoom it inside a square frame; the cropped image
// (canvas) is what gets uploaded. An existing image is shown as-is until replaced.
export default function OfferImageField({ currentImageUrl, onPick, onClear }: Props) {
  // Source currently being cropped (newly picked photo). null = no crop in progress.
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  // Preview of the CROPPED image (the produced square): reflects the final output and
  // feeds the "mobile card" preview rendered with object-cover.
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.click();

  // onPick may change on every render (it comes from a hook); kept in a ref so the
  // crop effect does not re-run in a loop.
  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

  // Revoke the source object URL when it changes / on unmount.
  useEffect(() => {
    if (!sourceUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  // Revoke the cropped-preview object URL when it changes / on unmount.
  useEffect(() => {
    if (!croppedPreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(croppedPreview);
  }, [croppedPreview]);

  // Produce the cropped image (debounced) once the crop settles: hands the parent the
  // file to upload AND refreshes the mobile preview.
  useEffect(() => {
    if (!sourceUrl || !area) return;
    const id = setTimeout(() => {
      cropToFile(sourceUrl, area)
        .then((file) => {
          onPickRef.current(file);
          setCroppedPreview(URL.createObjectURL(file));
        })
        .catch(() => { /* cropping failed: let the admin retry */ });
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

  // Cancel the in-progress crop: fall back to the existing image (or to nothing).
  const cancelCrop = () => {
    setSourceUrl(null);
    setArea(null);
    setCroppedPreview(null);
    onPick(null);
  };

  // Remove the image entirely (including an existing one).
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
        // Crop mode (a new photo was just picked).
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
        // Existing image (edit mode), shown as-is.
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
        // No image yet: add-photo placeholder button.
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

// "Mobile card" preview: the same cropped image shown in a banner frame (object-cover),
// mirroring the real mobile rendering, updated live.
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
