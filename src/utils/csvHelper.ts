import Papa from 'papaparse';
import { BatchItem, FormulaStyle } from '../types';

export const DEFAULT_SAMPLE_ITEMS: Omit<BatchItem, 'id' | 'status'>[] = [
  {
    sku: 'Shower Mat Chocolate 17x26 Inch',
    productLink: 'https://www.ajio.com/p/466292960001',
    imageLink: '',
  },
  {
    sku: 'Shower Mat Grey 17x26 Inch',
    productLink: 'https://www.ajio.com/p/466292939001',
    imageLink: '',
  },
  {
    sku: 'Shower Mat Taupe 40x70 cm',
    productLink: 'https://www.ajio.com/p/467163104001',
    imageLink: '',
  },
];

export function generateFormula(url: string, style: FormulaStyle): string {
  if (!url) return '';
  if (style === 'raw') return url;
  if (style === 'sheets') return `=IMAGE("${url}", 1)`;
  if (style === 'excel') return `=IMAGE("${url}")`;
  return url;
}

export function downloadCsvTemplate(includeSamples = true) {
  let content = 'SKU,Product Link,Image Link\n';
  if (includeSamples) {
    content += DEFAULT_SAMPLE_ITEMS.map((item) => `"${item.sku.replace(/"/g, '""')}","${item.productLink}",""`).join('\n');
    content += '\n';
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', includeSamples ? 'ajio_batch_template_with_samples.csv' : 'ajio_batch_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCsvFileContent(csvText: string): Array<{ sku: string; productLink: string; imageLink?: string }> {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.data && result.data.length > 0) {
    const rows = result.data as Record<string, string>[];
    const parsedList: Array<{ sku: string; productLink: string; imageLink?: string }> = [];

    for (const row of rows) {
      // Find matching keys case-insensitively
      const keys = Object.keys(row);
      const skuKey = keys.find((k) => /sku|name|title|product\s*name/i.test(k));
      const urlKey = keys.find((k) => /product\s*link|product_link|link|url|ajio/i.test(k));
      const imgKey = keys.find((k) => /image\s*link|image_link|image|photo|img/i.test(k));

      const sku = (skuKey ? row[skuKey] : keys[0] ? row[keys[0]] : '') || '';
      const productLink = (urlKey ? row[urlKey] : keys[1] ? row[keys[1]] : '') || '';
      const imageLink = (imgKey ? row[imgKey] : '') || '';

      if (productLink || sku) {
        parsedList.push({
          sku: sku.trim(),
          productLink: productLink.trim(),
          imageLink: imageLink.trim(),
        });
      }
    }

    if (parsedList.length > 0) return parsedList;
  }

  // Fallback: parse row by row without header
  const unparsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rawRows = unparsed.data as string[][];
  const list: Array<{ sku: string; productLink: string; imageLink?: string }> = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (i === 0 && row.some((col) => /sku|product|link/i.test(col))) {
      // Skip header
      continue;
    }
    const sku = row[0]?.trim() || '';
    const productLink = row[1]?.trim() || '';
    const imageLink = row[2]?.trim() || '';

    if (productLink || sku) {
      list.push({ sku, productLink, imageLink });
    }
  }

  return list;
}

export function exportProcessedCsv(
  items: BatchItem[],
  includeFormulaColumn = false,
  formulaStyle: FormulaStyle = 'sheets'
) {
  const fields = includeFormulaColumn
    ? ['SKU', 'Product Link', 'Image Link', 'Image Formula']
    : ['SKU', 'Product Link', 'Image Link'];

  const data = items.map((item) => {
    const row: Record<string, string> = {
      SKU: item.sku,
      'Product Link': item.productLink,
      'Image Link': item.imageLink,
    };
    if (includeFormulaColumn) {
      row['Image Formula'] = item.imageLink ? generateFormula(item.imageLink, formulaStyle) : '';
    }
    return row;
  });

  const csv = Papa.unparse({
    fields,
    data,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `ajio_extracted_images_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyTsvToClipboard(items: BatchItem[], formulaStyle: FormulaStyle = 'raw'): Promise<void> {
  const headers = ['SKU', 'Product Link', 'Image Link', 'Formula'];
  const lines = [headers.join('\t')];

  for (const item of items) {
    const formula = item.imageLink ? generateFormula(item.imageLink, formulaStyle) : '';
    lines.push([item.sku, item.productLink, item.imageLink, formula].join('\t'));
  }

  return navigator.clipboard.writeText(lines.join('\n'));
}
