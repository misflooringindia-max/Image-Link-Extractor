import React from 'react';
import { Layers, Sparkles, HelpCircle, FileSpreadsheet, Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  activeTab: 'batch' | 'single';
  setActiveTab: (tab: 'batch' | 'single') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  AJIO Image Extractor
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                  <Sparkles className="w-3 h-3 mr-1 text-rose-500" />
                  Formula Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Extract high-res CDN product images & generate Google Sheets / Excel <code className="text-rose-600 font-mono bg-rose-50/60 px-1 py-0.5 rounded">=IMAGE()</code> formulas
              </p>
            </div>
          </div>

          {/* Navigation & Guide Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setActiveTab('batch')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'batch'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Batch CSV Import</span>
              </button>
              <button
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'single'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4 text-rose-600" />
                <span>Single URL</span>
              </button>
            </div>

            <button
              onClick={onOpenGuide}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400"
              title="Learn how to use =IMAGE() formulas in Google Sheets and Excel"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">=IMAGE() Guide</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
