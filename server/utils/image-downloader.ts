import * as crypto from 'crypto';
import { objectStorageClient } from '../replit_integrations/object_storage/objectStorage';

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';

export interface DownloadResult {
  success: boolean;
  localPath?: string;
  localUrl?: string;
  error?: string;
}

function generateFileName(url: string, index: number = 0): string {
  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  const ext = getExtension(url);
  return `${hash}_${index}${ext}`;
}

function getExtension(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const ext = urlPath.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return `.${ext}`;
    }
  } catch {}
  return '.jpg';
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'image/jpeg';
}

export async function downloadImage(imageUrl: string, index: number = 0): Promise<DownloadResult> {
  try {
    if (!imageUrl || imageUrl.trim() === '') {
      return { success: false, error: 'Empty URL' };
    }

    if (imageUrl.startsWith('/product-images/')) {
      return { success: true, localPath: imageUrl, localUrl: imageUrl };
    }

    if (!BUCKET_ID) {
      console.error('[Image Downloader] DEFAULT_OBJECT_STORAGE_BUCKET_ID not set');
      return { success: false, error: 'Object storage not configured' };
    }

    const fileName = generateFileName(imageUrl, index);
    const objectPath = `public/product-images/${fileName}`;
    const localUrl = `/product-images/${fileName}`;

    const bucket = objectStorageClient.bucket(BUCKET_ID);
    const file = bucket.file(objectPath);

    const [exists] = await file.exists();
    if (exists) {
      return { success: true, localPath: objectPath, localUrl };
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://vivian-mall.com/',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const buffer = await response.arrayBuffer();
    const ext = getExtension(imageUrl);
    const contentType = getContentType(ext);

    await file.save(Buffer.from(buffer), {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`[Image Downloader] Uploaded to Object Storage: ${objectPath}`);
    return { success: true, localPath: objectPath, localUrl };
  } catch (error) {
    console.error(`[Image Downloader] Failed to download ${imageUrl}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function downloadProductImages(
  mainImage: string | null,
  galleryImages: string[],
  descriptionImages: string[]
): Promise<{
  mainImage: string | null;
  galleryImages: string[];
  descriptionImages: string[];
  stats: { total: number; downloaded: number; failed: number };
}> {
  const stats = { total: 0, downloaded: 0, failed: 0 };
  
  let newMainImage = mainImage;
  if (mainImage) {
    stats.total++;
    const result = await downloadImage(mainImage, 0);
    if (result.success && result.localUrl) {
      newMainImage = result.localUrl;
      stats.downloaded++;
    } else {
      stats.failed++;
    }
  }

  const newGalleryImages: string[] = [];
  for (let i = 0; i < galleryImages.length; i++) {
    stats.total++;
    const result = await downloadImage(galleryImages[i], i + 100);
    if (result.success && result.localUrl) {
      newGalleryImages.push(result.localUrl);
      stats.downloaded++;
    } else {
      newGalleryImages.push(galleryImages[i]);
      stats.failed++;
    }
  }

  const newDescriptionImages: string[] = [];
  for (let i = 0; i < descriptionImages.length; i++) {
    stats.total++;
    const result = await downloadImage(descriptionImages[i], i + 1000);
    if (result.success && result.localUrl) {
      newDescriptionImages.push(result.localUrl);
      stats.downloaded++;
    } else {
      newDescriptionImages.push(descriptionImages[i]);
      stats.failed++;
    }
  }

  return {
    mainImage: newMainImage,
    galleryImages: newGalleryImages,
    descriptionImages: newDescriptionImages,
    stats
  };
}
