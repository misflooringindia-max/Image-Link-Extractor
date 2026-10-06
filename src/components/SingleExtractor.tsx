import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Copy, Check, ExternalLink, Image as ImageIcon, PlusCircle, ArrowRight } from 'lucide-react';
import { ExtractedProductResponse, ImageResolution } from '../types';
import { generateFormula } from '../utils/csvHelper';

interface SingleExtractorProps {
  onAddToBatch: (item: { sku: string; productLink: string; imageLink: string }) => void;
}

export const SingleExtractor: React.FC<SingleExtractorProps> = ({ onAddToBatch }) => {
  const [urlInput, setUrlInput] = useState('https://www.ajio.com/p/466292960001');
  const [skuInput, setSkuInput] = useState('Shower Mat Chocolate 17x26 Inch');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedProductResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<ImageResolution>('superZoom');

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(urlInput.trim())}&sku=${encodeURIComponent(skuInput.trim())}`);
      const data: ExtractedProductResponse = await res.json();

      if (!data.success && data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setSelectedImage(data.primaryImage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to extraction service');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentDisplayImage = () => {
    if (!result) return '';
    if (selectedImage) {
      if (resolution === 'standard' && result.standardImage) return result.standardImage;
      if (resolution === 'thumbnail' && result.thumbnailImage) return result.thumbnailImage;
      return selectedImage;
    }
    if (resolution === 'standard') return result.standardImage;
    if (resolution === 'thumbnail') return result.thumbnailImage;
    return result.primaryImage;
  };

  const activeUrl = currentDisplayImage();
  const sheetsFormula = generateFormula(activeUrl, 'sheets');
  const excelFormula = generateFormula(activeUrl, 'excel');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Single AJIO Product Extractor</span>
              <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-semibold border border-rose-100">
                Live CDN
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste any AJIO product link or 12-digit code to extract full-resolution image links & spreadsheet formulas
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUrlInput('https://www.ajio.com/p/466292960001');
              setSkuInput('Shower Mat Chocolate 17x26 Inch');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline hidden sm:block"
          >
            Load Sample
          </button>
        </div>

        <form onSubmit={handleExtract} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AJIO Product Link or Code:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.ajio.com/p/466292960001 or 466292960001"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Name (Optional):
              </label>
              <input
                type="text"
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                placeholder="e.g. Shower Mat Chocolate"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://www.ajio.com/p/466292939001');
                  setSkuInput('Shower Mat Grey 17x26 Inch');
                }}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-mono"
              >
                Sample 2: Grey Mat
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://www.ajio.com/p/467163104001');
                  setSkuInput('Shower Mat Taupe 40x70 cm');
                }}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-mono"
              >
                Sample 3: Taupe Mat
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all hover:shadow-lg hover:shadow-rose-600/30 active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Extract Image Link</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <strong>Extraction Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Extraction Result Showcase */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {result.brand || 'AJIO'} Product Found
              </span>
            </div>
            <button
              onClick={() => {
                onAddToBatch({
                  sku: result.sku || result.title,
                  productLink: result.originalUrl,
                  imageLink: activeUrl,
                });
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add to Batch Table</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Image Preview Column */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative group shadow-inner">
                {activeUrl ? (
                  <img
                    src={activeUrl}
                    alt={result.title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                )}

                {activeUrl && (
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full JPG</span>
                  </a>
                )}
              </div>

              {/* Gallery Angles */}
              {result.allImages && result.allImages.length > 1 && (
                <div className="mt-3 w-full">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Available Gallery Angles ({result.allImages.length}):
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {result.allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img.url)}
                        className={`flex-shrink-0 w-12 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                          selectedImage === img.url
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Metadata & Formulas Column */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Title & Specs */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {result.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {result.sku && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        SKU: {result.sku}
                      </span>
                    )}
                    {result.price && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                        Price: {result.price}
                      </span>
                    )}
                    {result.color && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Color: {result.color}
                      </span>
                    )}
                    <span className="text-xs bg-rose-50 text-rose-700 font-mono px-2 py-0.5 rounded">
                      Code: {result.productCode}
                    </span>
                  </div>
                </div>

                {/* Resolution Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Image Quality / Resolution:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setResolution('superZoom')}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        resolution === 'superZoom'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="font-bold">Super Zoom</div>
                      <div className="text-[10px] text-slate-400">1117 × 1400 px</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolution('standard')}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        resolution === 'standard'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="font-bold">Standard</div>
                      <div className="text-[10px] text-slate-400">473 × 593 px</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolution('thumbnail')}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        resolution === 'thumbnail'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="font-bold">Listing</div>
                      <div className="text-[10px] text-slate-400">288 × 360 px</div>
                    </button>
                  </div>
                </div>

                {/* Direct Image Link */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Image CDN Link:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={activeUrl}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 select-all focus:outline-hidden"
                    />
                    <button
                      onClick={() => copyText(activeUrl, 'cdn')}
                      className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      {copiedKey === 'cdn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'cdn' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Google Sheets Formula */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Google Sheets Formula:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Formula Mode</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={sheetsFormula}
                      className="w-full text-xs font-mono bg-emerald-50/60 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-950 select-all focus:outline-hidden"
                    />
                    <button
                      onClick={() => copyText(sheetsFormula, 'sheets')}
                      className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      {copiedKey === 'sheets' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'sheets' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Excel Formula */}
                <div>
                  <label className="block text-xs font-semibold text-blue-800 mb-1">
                    Excel 365 Formula:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={excelFormula}
                      className="w-full text-xs font-mono bg-blue-50/60 border border-blue-300 rounded-lg px-3 py-2 text-blue-950 select-all focus:outline-hidden"
                    />
                    <button
                      onClick={() => copyText(excelFormula, 'excel')}
                      className="flex-shrink-0 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      {copiedKey === 'excel' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'excel' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
