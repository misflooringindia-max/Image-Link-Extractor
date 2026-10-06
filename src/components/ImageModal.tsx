import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import { generateFormula } from '../utils/csvHelper';

interface ImageModalProps {
  item: {
    sku: string;
    productLink: string;
    imageLink: string;
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
  } | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ item, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedImgUrl, setSelectedImgUrl] = useState<string | null>(null);

  if (!item) return null;

  const currentUrl = selectedImgUrl || item.imageLink;
  const sheetsFormula = generateFormula(currentUrl, 'sheets');
  const excelFormula = generateFormula(currentUrl, 'excel');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              {item.brand || 'AJIO Product Preview'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
              {item.productTitle || item.sku}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image Display */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative group shadow-inner">
              {currentUrl ? (
                <img
                  src={currentUrl}
                  alt={item.sku}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 stroke-1 mb-2" />
                  <span className="text-sm">No image available</span>
                </div>
              )}

              {currentUrl && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </a>
              )}
            </div>

            {/* Gallery thumbnails if available */}
            {item.allImages && item.allImages.length > 1 && (
              <div className="mt-4 w-full">
                <span className="text-xs font-semibold text-slate-500 block mb-2">
                  All Angles ({item.allImages.length}):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {item.allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgUrl(img.url)}
                      className={`relative flex-shrink-0 w-14 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                        currentUrl === img.url
                          ? 'border-rose-500 ring-2 ring-rose-200 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info & Formula Generator */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Product Meta */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">SKU:</span> {item.sku}
                </div>
                {item.color && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Color:</span> {item.color}
                  </div>
                )}
                {item.price && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Price:</span> {item.price}
                  </div>
                )}
                <div className="text-xs text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">AJIO Link:</span>{' '}
                  <a
                    href={item.productLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 hover:underline inline-flex items-center ml-1"
                  >
                    View on AJIO <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Direct Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Image CDN Link:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full text-xs font-mono bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 truncate select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => copyToClipboard(currentUrl, 'url')}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    {copiedType === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Google Sheets Formula */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Sheets Formula:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Fits inside cell</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={sheetsFormula}
                    className="w-full text-xs font-mono bg-emerald-50/60 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-900 truncate select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => copyToClipboard(sheetsFormula, 'sheets')}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    {copiedType === 'sheets' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'sheets' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Excel Formula */}
              <div>
                <label className="block text-xs font-semibold text-blue-700 mb-1">
                  Microsoft Excel Formula:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={excelFormula}
                    className="w-full text-xs font-mono bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-2 text-blue-900 truncate select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => copyToClipboard(excelFormula, 'excel')}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    {copiedType === 'excel' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'excel' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <a
                href={currentUrl}
                download={`${item.sku || 'ajio_product'}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save JPG</span>
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
