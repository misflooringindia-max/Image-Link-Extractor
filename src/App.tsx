import React, { useState } from 'react';
import { Header } from './components/Header';
import { BatchExtractor } from './components/BatchExtractor';
import { SingleExtractor } from './components/SingleExtractor';
import { ImageModal } from './components/ImageModal';
import { FormulaGuideModal } from './components/FormulaGuideModal';
import { BatchItem } from './types';
import { DEFAULT_SAMPLE_ITEMS } from './utils/csvHelper';
import { Sparkles, Layers, ShieldCheck, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'batch' | 'single'>('batch');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [modalItem, setModalItem] = useState<BatchItem | null>(null);

  // Initialize with the user's 3 requested items
  const [items, setItems] = useState<BatchItem[]>(() =>
    DEFAULT_SAMPLE_ITEMS.map((item, index) => ({
      id: `initial-${index}`,
      sku: item.sku,
      productLink: item.productLink,
      imageLink: '',
      status: 'pending',
    }))
  );

  const handleAddToBatch = (newItem: { sku: string; productLink: string; imageLink: string }) => {
    const item: BatchItem = {
      id: `added-${Date.now()}`,
      sku: newItem.sku,
      productLink: newItem.productLink,
      imageLink: newItem.imageLink,
      status: newItem.imageLink ? 'success' : 'pending',
    };
    setItems((prev) => [item, ...prev]);
    setActiveTab('batch');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Informational Pill Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border border-rose-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              <strong className="text-slate-900">Batch AJIO CDN Extractor:</strong> Extracts original 1117×1400px product image links directly from AJIO server catalog. Ready for Excel & Google Sheets <code className="bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs font-semibold">=IMAGE()</code> formulas.
            </div>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-800 shrink-0 underline underline-offset-2 flex items-center space-x-1"
          >
            <span>Read Formula Guide</span>
          </button>
        </div>

        {/* Tab View */}
        {activeTab === 'batch' ? (
          <BatchExtractor
            items={items}
            setItems={setItems}
            onViewImage={(item) => setModalItem(item)}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        ) : (
          <SingleExtractor onAddToBatch={handleAddToBatch} />
        )}
      </main>

      {/* High-Res Image Modal Lightbox */}
      <ImageModal item={modalItem} onClose={() => setModalItem(null)} />

      {/* Formula & Tutorial Modal */}
      <FormulaGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">AJIO Image Link Extractor</span>
            <span>•</span>
            <span>CSV Batch Processing & Google Sheets =IMAGE() Tool</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center space-x-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>CORS & Akamai Bypass Active</span>
            </span>
            <span>•</span>
            <span>High-Res 1117×1400 Supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
