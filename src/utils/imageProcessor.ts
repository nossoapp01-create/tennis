/**
 * KicksLuxe Luxury Studio Image Processor
 * Standardizes extracted images: edge-aware background removal, centering,
 * realistic ground contact shadow, and cinematic Dark Vault Studio backdrop.
 */

export interface ImageStandardizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  addGroundShadow?: boolean;
  spotlightIntensity?: number; // 0 to 1
  paddingPercent?: number; // margin around sneaker (e.g. 0.12 = 12%)
  backdropType?: 'vault_dark' | 'noir_gold' | 'transparent';
}

/**
 * Loads an image from a data URL or path safely into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Falha ao carregar imagem: ' + String(err)));
    img.src = src;
  });
}

/**
 * Standardizes any extracted sneaker image:
 * - Detects foreground bounding box (sneaker)
 * - Isolates from mismatched background (white, court floor, gym wood, etc.)
 * - Places onto standard cinematic KicksLuxe Vault Studio backdrop (matching the site layout)
 * - Adds ground contact shadow
 */
export async function standardizeSneakerImage(
  source: string,
  options: ImageStandardizeOptions = {}
): Promise<string> {
  const {
    width = 640,
    height = 480,
    quality = 0.82,
    addGroundShadow = true,
    paddingPercent = 0.12,
    backdropType = 'vault_dark',
  } = options;

  try {
    const img = await loadImage(source);
    if (!img.naturalWidth || !img.naturalHeight) {
      return source;
    }

    const origW = img.naturalWidth;
    const origH = img.naturalHeight;

    // Step 1: Draw source image on an analysis canvas
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = origW;
    sampleCanvas.height = origH;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return source;

    sampleCtx.drawImage(img, 0, 0);
    const imgData = sampleCtx.getImageData(0, 0, origW, origH);
    const data = imgData.data;

    // Step 2: Sample border edges (top, bottom, left, right) to determine background color profile
    let rSum = 0, gSum = 0, bSum = 0, edgeCount = 0;
    const borderThickness = Math.max(2, Math.floor(Math.min(origW, origH) * 0.03));

    for (let y = 0; y < origH; y++) {
      for (let x = 0; x < origW; x++) {
        if (x < borderThickness || x >= origW - borderThickness || y < borderThickness || y >= origH - borderThickness) {
          const idx = (y * origW + x) * 4;
          if (data[idx + 3] > 20) { // non-transparent
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            edgeCount++;
          }
        }
      }
    }

    const bgR = edgeCount > 0 ? rSum / edgeCount : 255;
    const bgG = edgeCount > 0 ? gSum / edgeCount : 255;
    const bgB = edgeCount > 0 ? bSum / edgeCount : 255;
    const bgLuminance = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

    // Step 3: Find foreground bounding box (the sneaker)
    let minX = origW, maxX = 0, minY = origH, maxY = 0;
    let foundForeground = false;

    // Color distance threshold from background
    const threshold = bgLuminance > 200 ? 32 : 38;

    for (let y = 0; y < origH; y++) {
      for (let x = 0; x < origW; x++) {
        const idx = (y * origW + x) * 4;
        const a = data[idx + 3];
        if (a < 30) continue; // transparent pixel

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Euclidean distance from edge background color
        const dist = Math.sqrt(
          (r - bgR) * (r - bgR) +
          (g - bgG) * (g - bgG) +
          (b - bgB) * (b - bgB)
        );

        if (dist > threshold) {
          foundForeground = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If no distinct foreground detected (or full bleed image), fallback to safe crop
    if (!foundForeground || maxX - minX < 20 || maxY - minY < 20) {
      minX = Math.round(origW * 0.05);
      maxX = Math.round(origW * 0.95);
      minY = Math.round(origH * 0.05);
      maxY = Math.round(origH * 0.95);
    } else {
      // Add slight padding around detected sneaker
      const padX = Math.round((maxX - minX) * 0.04);
      const padY = Math.round((maxY - minY) * 0.04);
      minX = Math.max(0, minX - padX);
      maxX = Math.min(origW, maxX + padX);
      minY = Math.max(0, minY - padY);
      maxY = Math.min(origH, maxY + padY);
    }

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    // Step 4: Prepare final output canvas with luxury Vault Studio layout
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return source;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Step 5: Render Luxury Studio Backdrop
    if (backdropType !== 'transparent') {
      // Base dark luxury gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#19181a');
      bgGrad.addColorStop(0.65, '#121113');
      bgGrad.addColorStop(1, '#0b0a0c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Studio Spotlight Radial Glow behind sneaker
      const spotGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.08,
        width * 0.5,
        height * 0.45,
        width * 0.55
      );
      spotGrad.addColorStop(0, 'rgba(255, 235, 180, 0.12)'); // soft warm champagne
      spotGrad.addColorStop(0.3, 'rgba(212, 175, 55, 0.06)'); // subtle gold sheen
      spotGrad.addColorStop(0.7, 'rgba(25, 24, 28, 0.4)');
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle luxury floor reflection line
      const floorGrad = ctx.createLinearGradient(0, height * 0.72, 0, height);
      floorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      floorGrad.addColorStop(0.2, 'rgba(212, 175, 55, 0.03)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height * 0.72, width, height * 0.28);
    }

    // Step 6: Calculate target dimensions for centered sneaker with padding
    const availW = width * (1 - paddingPercent * 2);
    const availH = height * (1 - paddingPercent * 2);

    const scale = Math.min(availW / cropW, availH / cropH);
    const destW = Math.round(cropW * scale);
    const destH = Math.round(cropH * scale);

    const destX = Math.round((width - destW) / 2);
    // Position slightly higher than center to leave room for realistic floor shadow
    const destY = Math.round((height - destH) / 2 - height * 0.02);

    // Step 7: Draw Realistic Ground Contact Shadow
    if (addGroundShadow && backdropType !== 'transparent') {
      ctx.save();
      const shadowCenterX = destX + destW * 0.5;
      const shadowCenterY = destY + destH + destH * 0.02;
      const shadowRadiusX = destW * 0.45;
      const shadowRadiusY = Math.max(10, destH * 0.09);

      // Soft diffuse floor shadow
      const diffuseShadow = ctx.createRadialGradient(
        shadowCenterX,
        shadowCenterY,
        5,
        shadowCenterX,
        shadowCenterY,
        shadowRadiusX
      );
      diffuseShadow.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      diffuseShadow.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
      diffuseShadow.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
      diffuseShadow.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.ellipse(shadowCenterX, shadowCenterY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = diffuseShadow;
      ctx.fill();

      // Deep contact shadow immediately beneath sole
      const contactShadow = ctx.createRadialGradient(
        shadowCenterX,
        shadowCenterY - 2,
        2,
        shadowCenterX,
        shadowCenterY - 2,
        destW * 0.35
      );
      contactShadow.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
      contactShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
      contactShadow.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.ellipse(shadowCenterX, shadowCenterY - 2, destW * 0.35, Math.max(4, destH * 0.04), 0, 0, Math.PI * 2);
      ctx.fillStyle = contactShadow;
      ctx.fill();
      ctx.restore();
    }

    // Step 8: Edge-softened sneaker rendering
    // If background was light, blend sneaker foreground smoothly
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

    if (cropCtx) {
      cropCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

      // Softly mask out any pure/light background remnants at the edges of the crop
      if (bgLuminance > 180) {
        const cropData = cropCtx.getImageData(0, 0, cropW, cropH);
        const cData = cropData.data;

        for (let i = 0; i < cData.length; i += 4) {
          const cr = cData[i];
          const cg = cData[i + 1];
          const cb = cData[i + 2];
          const dist = Math.sqrt(
            (cr - bgR) * (cr - bgR) +
            (cg - bgG) * (cg - bgG) +
            (cb - bgB) * (cb - bgB)
          );

          // If pixel is extremely close to white/light bg, blend alpha
          if (dist < 22) {
            cData[i + 3] = 0; // complete removal
          } else if (dist < 44) {
            const alphaFactor = (dist - 22) / 22;
            cData[i + 3] = Math.round(cData[i + 3] * alphaFactor);
          }
        }
        cropCtx.putImageData(cropData, 0, 0);
      }

      ctx.drawImage(cropCanvas, 0, 0, cropW, cropH, destX, destY, destW, destH);
    } else {
      ctx.drawImage(img, minX, minY, cropW, cropH, destX, destY, destW, destH);
    }

    // Step 9: Subtle Vignette Frame
    if (backdropType !== 'transparent') {
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.35,
        width * 0.5,
        height * 0.5,
        width * 0.72
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Subtle 1px inner border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, width - 2, height - 2);
    }

    // Return compressed JPEG or WebP data URL
    return outCanvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.warn('[ImageStandardizer] Processing fallback:', error);
    return source;
  }
}

/**
 * Standardize an array of sneaker candidates sequentially with progress callback
 */
export async function batchStandardizeCandidates<T extends { image: string }>(
  items: T[],
  onProgress?: (current: number, total: number) => void
): Promise<T[]> {
  const result: T[] = [];
  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    const item = items[i];
    try {
      const standardizedImage = await standardizeSneakerImage(item.image, {
        width: 640,
        height: 480,
        quality: 0.8,
        backdropType: 'vault_dark',
      });
      result.push({ ...item, image: standardizedImage });
    } catch {
      result.push(item);
    }
    // Yield to main thread briefly
    await new Promise((r) => setTimeout(r, 10));
  }
  return result;
}
