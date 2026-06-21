import { toBlob } from 'html-to-image';
import { CARD_HEIGHT, CARD_WIDTH } from '@/app/lib/constants';
import { prepareImagesForCapture, waitForExportImages } from '@/app/lib/export/prepare-export-images';

export const DEFAULT_EXPORT_SCALE = 3;

export function clearExportSelectionState(): void {
  if (typeof document === 'undefined') return;

  window.getSelection()?.removeAllRanges();
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export async function waitForExportLayout(): Promise<void> {
  clearExportSelectionState();

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForExportImages();
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function captureCardElement(
  element: HTMLElement,
  scale = DEFAULT_EXPORT_SCALE,
): Promise<Blob> {
  clearExportSelectionState();

  const safeScale = Math.max(1, scale);
  const restoreImages = await prepareImagesForCapture(element);
  try {
    const blob = await toBlob(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      canvasWidth: CARD_WIDTH * safeScale,
      canvasHeight: CARD_HEIGHT * safeScale,
      pixelRatio: 1,
      cacheBust: false,
      skipAutoScale: true,
      includeQueryParams: true,
    });

    if (!blob) {
      throw new Error('Failed to capture card image from DOM');
    }

    return blob;
  } finally {
    restoreImages();
  }
}
