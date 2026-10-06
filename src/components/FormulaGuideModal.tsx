import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, ExternalLink, Lightbulb, Sparkles } from 'lucide-react';

interface FormulaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaGuideModal: React.FC<FormulaGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSample, setCopiedSample] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSample(id);
    setTimeout(() => setCopiedSample(null), 2000);
  };

  const sampleUrl = 'https://assets.ajio.com/medias/sys_master/root/20230621/ZM4G/649260cf42f9e729d7639485/-1117Wx1400H-466292960-brown-MODEL.jpg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Spreadsheet =IMAGE() Formula Guide
              </h3>
              <p className="text-xs text-slate-500">
                Google Sheets & Microsoft Excel 365 image formula tutorial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Hindi Summary Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>आसान हिंदी गाइड (Easy Hindi Guide):</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              जब आप CSV डाउनलोड करेंगे, तो <strong>Column C (Image Link)</strong> में सीधा AJIO का हाई-क्वालिटी CDN लिंक मिलेगा। अगर आप एक्सेल या गूगल शीट्स में इमेज दिखाना चाहते हैं, तो <strong>Column D</strong> में <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">=IMAGE(C2)</code> लिख दें — फोटो अपने-आप सेल के अंदर दिखेगी!
            </p>
          </div>

          {/* Section 1: Google Sheets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>1. Google Sheets Formulas</span>
              </h4>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                Recommended
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Formula Option A */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Fit inside cell (aspect ratio preserved):
                  </div>
                  <code className="text-emerald-700 font-mono text-xs mt-0.5 block">
                    =IMAGE(C2, 1)
                  </code>
                </div>
                <button
                  onClick={() => copyCode('=IMAGE(C2, 1)', 'gs1')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-1 transition-all"
                >
                  {copiedSample === 'gs1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSample === 'gs1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Formula Option B */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Direct URL Formula:
                  </div>
                  <code className="text-emerald-700 font-mono text-xs mt-0.5 block line-clamp-1 max-w-sm">
                    =IMAGE("{sampleUrl.slice(0, 45)}...", 1)
                  </code>
                </div>
                <button
                  onClick={() => copyCode(`=IMAGE("${sampleUrl}", 1)`, 'gs2')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-1 transition-all"
                >
                  {copiedSample === 'gs2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSample === 'gs2' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Formula Option C */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Custom Dimensions (e.g. 120 x 150 px):
                  </div>
                  <code className="text-emerald-700 font-mono text-xs mt-0.5 block">
                    =IMAGE(C2, 4, 150, 120)
                  </code>
                </div>
                <button
                  onClick={() => copyCode('=IMAGE(C2, 4, 150, 120)', 'gs3')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-1 transition-all"
                >
                  {copiedSample === 'gs3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSample === 'gs3' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Microsoft Excel */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>2. Microsoft Excel 365 Formulas</span>
            </h4>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-800">
                  Referencing Image Link cell:
                </div>
                <code className="text-blue-700 font-mono text-xs mt-0.5 block">
                  =IMAGE(C2)
                </code>
              </div>
              <button
                onClick={() => copyCode('=IMAGE(C2)', 'ex1')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-1 transition-all"
              >
                {copiedSample === 'ex1' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSample === 'ex1' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Tips for Best Quality */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Pro Tip for Displaying Crisp Images in Sheets:</span>
            </div>
            <p>
              In Google Sheets, select all rows and set the <strong>Row Height to 100 or 120 px</strong>, and set the Column Width to 100 px. The images will automatically expand to fill the cell neatly without pixelation because our tool extracts <strong>1117 x 1400 px</strong> high-resolution links!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
