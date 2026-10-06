export type ImageResolution = 'superZoom' | 'standard' | 'thumbnail';

export type FormulaStyle = 'raw' | 'sheets' | 'excel';

export interface BatchItem {
  id: string;
  sku: string;
  productLink: string;
  imageLink: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  productTitle?: string;
  brand?: string;
  price?: string;
  color?: string;
  allImages?: Array<{
    url: string;
    format: string;
    type: 'PRIMARY' | 'GALLERY';
    alt?: string;
  }>;
}

export interface ExtractedProductResponse {
  success: boolean;
  sku?: string;
  productCode: string;
  originalUrl: string;
  title: string;
  brand?: string;
  color?: string;
  price?: string;
  mrp?: string;
  primaryImage: string;
  standardImage: string;
  thumbnailImage: string;
  allImages: Array<{
    url: string;
    format: string;
    type: 'PRIMARY' | 'GALLERY';
    alt?: string;
  }>;
  error?: string;
}
