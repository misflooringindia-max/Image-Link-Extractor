export interface ExtractedImage {
  url: string;
  format: string;
  type: 'PRIMARY' | 'GALLERY';
  alt?: string;
}

export interface AjioProductData {
  success: boolean;
  sku?: string;
  productCode: string;
  originalUrl: string;
  title: string;
  brand?: string;
  color?: string;
  price?: string;
  mrp?: string;
  primaryImage: string; // High-res / superZoom URL
  standardImage: string; // 473x593
  thumbnailImage: string; // 288x360 or 78x98
  allImages: ExtractedImage[];
  error?: string;
}

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

export function normalizeAjioUrl(input: string): { url: string; code: string } {
  const trimmed = input.trim();
  // Check if it's just a number like 466292960001
  if (/^\d{8,15}$/.test(trimmed)) {
    return {
      url: `https://www.ajio.com/p/${trimmed}`,
      code: trimmed,
    };
  }

  // If it's a URL like https://www.ajio.com/p/466292960001 or https://www.ajio.com/brand-name/p/466292960001
  const codeMatch = trimmed.match(/\/p\/([0-9a-zA-Z_-]+)/);
  const code = codeMatch ? codeMatch[1] : '';

  let url = trimmed;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return { url, code };
}

export async function extractAjioProduct(
  inputUrl: string,
  sku?: string
): Promise<AjioProductData> {
  const { url, code } = normalizeAjioUrl(inputUrl);

  if (!code && !url.includes('ajio.com')) {
    return {
      success: false,
      sku,
      productCode: code || 'UNKNOWN',
      originalUrl: inputUrl,
      title: sku || 'Invalid URL',
      primaryImage: '',
      standardImage: '',
      thumbnailImage: '',
      allImages: [],
      error: 'Not a valid AJIO product URL or product code.',
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`AJIO server responded with HTTP status ${response.status}`);
    }

    const html = await response.text();

    // 1. Try __PRELOADED_STATE__
    const preloadedMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
    if (preloadedMatch) {
      try {
        const state = JSON.parse(preloadedMatch[1]);
        const details = state?.product?.productDetails;

        if (details) {
          const rawImages: any[] = Array.isArray(details.images) ? details.images : [];
          const allImages: ExtractedImage[] = [];

          let superZoomUrl = '';
          let standardUrl = '';
          let thumbnailUrl = '';

          for (const img of rawImages) {
            const imgUrl = img.url || '';
            if (!imgUrl) continue;

            const format = img.format || '';
            const type = img.imageType === 'PRIMARY' ? 'PRIMARY' : 'GALLERY';
            const alt = img.altText || details.name;

            allImages.push({
              url: imgUrl,
              format,
              type,
              alt,
            });

            if (type === 'PRIMARY') {
              if (format === 'superZoomPdp') superZoomUrl = imgUrl;
              if (format === 'product') standardUrl = imgUrl;
              if (format === 'mobileProductListingImage' || format === 'thumbnail') {
                if (!thumbnailUrl) thumbnailUrl = imgUrl;
              }
            }
          }

          // Fallbacks for resolutions
          const primaryImage =
            superZoomUrl ||
            standardUrl ||
            allImages.find((i) => i.type === 'PRIMARY')?.url ||
            allImages[0]?.url ||
            '';

          const finalStandard =
            standardUrl ||
            superZoomUrl ||
            primaryImage;

          const finalThumbnail =
            thumbnailUrl ||
            finalStandard ||
            primaryImage;

          return {
            success: Boolean(primaryImage),
            sku,
            productCode: details.code || code,
            originalUrl: inputUrl,
            title: details.name || sku || 'AJIO Product',
            brand: details.brandName || '',
            color: details.baseOptions?.[0]?.selected?.color || '',
            price: details.price?.formattedValue || details.price?.displayformattedValue || '',
            mrp: details.wasPriceData?.formattedValue || '',
            primaryImage,
            standardImage: finalStandard,
            thumbnailImage: finalThumbnail,
            allImages,
          };
        }
      } catch (jsonErr) {
        // Fallback to HTML parsing below
      }
    }

    // 2. Fallback: Parse og:image and json-ld
    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const ogImage = ogImageMatch ? ogImageMatch[1] : '';

    const titleMatch =
      html.match(/<title>([^<]*)<\/title>/i) ||
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].replace(/ - AJIO.*/i, '').trim() : sku || 'AJIO Product';

    // Upgrade thumbnail ogImage to high-res if it has size pattern e.g. -78Wx98H- or -473Wx593H-
    let highRes = ogImage;
    if (highRes && highRes.includes('Wx') && highRes.includes('H-')) {
      highRes = highRes.replace(/-\d+Wx\d+H-/, '-1117Wx1400H-');
    }

    if (ogImage || highRes) {
      return {
        success: true,
        sku,
        productCode: code,
        originalUrl: inputUrl,
        title,
        primaryImage: highRes || ogImage,
        standardImage: ogImage,
        thumbnailImage: ogImage,
        allImages: [
          { url: highRes || ogImage, format: 'superZoomPdp', type: 'PRIMARY', alt: title },
        ],
      };
    }

    throw new Error('Could not find product image in AJIO page.');
  } catch (err: any) {
    return {
      success: false,
      sku,
      productCode: code || 'UNKNOWN',
      originalUrl: inputUrl,
      title: sku || 'Product',
      primaryImage: '',
      standardImage: '',
      thumbnailImage: '',
      allImages: [],
      error: err.message || 'Failed to fetch AJIO product',
    };
  }
}
