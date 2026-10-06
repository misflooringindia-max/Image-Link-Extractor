import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Eye,
  FileText,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BatchItem, FormulaStyle, ImageResolution, ExtractedProductResponse } from '../types';
import {
  DEFAULT_SAMPLE_ITEMS,
  downloadCsvTemplate,
  parseCsvFileContent,
  exportProcessedCsv,
  copyTsvToClipboard,
  generateFormula,
} from '../utils/csvHelper';

interface BatchExtractorProps {
  items: BatchItem[];
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  onViewImage: (item: BatchItem) => void;
  onOpenGuide: () => void;
}

export const BatchExtractor: React.FC<BatchExtractorProps> = ({
  items,
  setItems,
  onViewImage,
  onOpenGuide,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [resolution, setResolution] = useState<ImageResolution>('superZoom');
  const [formulaStyle, setFormulaStyle] = useState<FormulaStyle>('raw');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopRequestedRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Statistics
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'success').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const pendingCount = items.filter((i) => i.status === 'pending' || i.status === 'processing').length;
  const progressPercent = totalCount > 0 ? Math.round(((completedCount + errorCount) / totalCount) * 100) : 0;

  const showToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Trigger file upload dialog
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const parsed = parseCsvFileContent(text);
      if (parsed.length === 0) {
        showToast('No valid rows found in file');
        return;
      }

      const newItems: BatchItem[] = parsed.map((p, index) => ({
        id: `uploaded-${Date.now()}-${index}`,
        sku: p.sku || `Product ${index + 1}`,
        productLink: p.productLink,
        imageLink: p.imageLink || '',
        status: p.imageLink ? 'success' : 'pending',
      }));

      setItems(newItems);
      showToast(`Loaded ${newItems.length} rows from CSV`);
    };
    reader.readAsText(file);
  };

  // Handle Paste import
  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    const parsed = parseCsvFileContent(pasteText);
    if (parsed.length === 0) {
      showToast('Could not parse pasted data');
      return;
    }

    const newItems: BatchItem[] = parsed.map((p, index) => ({
      id: `pasted-${Date.now()}-${index}`,
      sku: p.sku || `Product ${index + 1}`,
      productLink: p.productLink,
      imageLink: p.imageLink || '',
      status: p.imageLink ? 'success' : 'pending',
    }));

    setItems(newItems);
    setShowPasteModal(false);
    setPasteText('');
    showToast(`Loaded ${newItems.length} rows from pasted text`);
  };

  // Load default samples
  const handleLoadSamples = () => {
    const sampleItems: BatchItem[] = DEFAULT_SAMPLE_ITEMS.map((item, idx) => ({
      id: `sample-${idx}`,
      sku: item.sku,
      productLink: item.productLink,
      imageLink: '',
      status: 'pending',
    }));
    setItems(sampleItems);
    showToast('Loaded 3 sample items from brief');
  };

  // Add single row manually
  const handleAddRow = () => {
    const newItem: BatchItem = {
      id: `row-${Date.now()}`,
      sku: `New Mat ${items.length + 1}`,
      productLink: 'https://www.ajio.com/p/',
      imageLink: '',
      status: 'pending',
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update row
  const handleUpdateRow = (id: string, field: 'sku' | 'productLink', value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value, status: 'pending' } : item))
    );
  };

  // Clear all
  const handleClearAll = () => {
    if (isRunning) return;
    setItems([]);
  };

  // Run Batch Extraction
  const handleStartExtraction = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    stopRequestedRef.current = false;

    const itemsToProcess = [...items];
    const concurrency = 3; // 3 parallel requests

    // Helper to fetch one item
    const processSingleItem = async (item: BatchItem) => {
      if (stopRequestedRef.current) return;
      while (pausedRef.current) {
        await new Promise((r) => setTimeout(r, 400));
        if (stopRequestedRef.current) return;
      }

      // Mark processing
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', errorMessage: undefined } : i))
      );

      try {
        const res = await fetch(
          `/api/extract?url=${encodeURIComponent(item.productLink.trim())}&sku=${encodeURIComponent(item.sku.trim())}`
        );
        const data: ExtractedProductResponse = await res.json();

        if (data.success) {
          const chosenImage =
            resolution === 'standard' && data.standardImage
              ? data.standardImage
              : resolution === 'thumbnail' && data.thumbnailImage
              ? data.thumbnailImage
              : data.primaryImage;

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'success',
                    imageLink: chosenImage,
                    productTitle: data.title,
                    brand: data.brand,
                    price: data.price,
                    color: data.color,
                    allImages: data.allImages,
                  }
                : i
            )
          );
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'error',
                    errorMessage: data.error || 'Failed to extract image',
                  }
                : i
            )
          );
        }
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  errorMessage: err.message || 'Network error',
                }
              : i
          )
        );
      }
    };

    // Filter items that need extraction (pending or error)
    const targets = itemsToProcess.filter((i) => i.status !== 'success');
    let idx = 0;

    const worker = async () => {
      while (idx < targets.length && !stopRequestedRef.current) {
        const currentTarget = targets[idx++];
        await processSingleItem(currentTarget);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, targets.length) }, () => worker());
    await Promise.all(workers);

    setIsRunning(false);
    setIsPaused(false);

    // If finished and we had successes, throw confetti!
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    showToast('Batch extraction complete!');
  };

  const handleStopExtraction = () => {
    stopRequestedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleRetryFailed = () => {
    setItems((prev) =>
      prev.map((i) => (i.status === 'error' ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    setTimeout(() => {
      handleStartExtraction();
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
        accept=".csv,.tsv,.txt"
        className="hidden"
      />

      {/* Top Controls & Template Download Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Template & CSV Info */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                CSV 3-Column Specification
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-600">SKU, Product Link, Image Link</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Batch AJIO Image Extraction & Formula Export
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upload your CSV file containing the 3 columns. The app will fetch high-res CDN images for each AJIO link, fill in the <strong className="text-slate-900">Image Link</strong> column, and allow instant export with Google Sheets / Excel <code className="text-rose-600 font-mono bg-rose-50 px-1 py-0.5 rounded text-xs">=IMAGE()</code> formulas.
            </p>

            {/* Quick Template Download Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => downloadCsvTemplate(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                title="Download CSV Template pre-filled with 3 sample bath mats"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                <span>Download Template (With Samples)</span>
              </button>

              <button
                onClick={() => downloadCsvTemplate(false)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                title="Download blank 3-column CSV template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Blank Template</span>
              </button>

              <button
                onClick={onOpenGuide}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs text-amber-700 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200/60"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>=IMAGE() Formula Guide</span>
              </button>
            </div>
          </div>

          {/* Right: Drag & Drop Zone */}
          <div className="lg:col-span-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              onClick={handleTriggerUpload}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-rose-500 bg-rose-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-rose-100/70 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                Click to Upload CSV or Drag & Drop
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Supports .csv, .tsv, .txt files with 3 columns
              </div>

              <div className="mt-3 flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasteModal(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                >
                  Or Paste Text / Table
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSamples();
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  Reset to 3 Samples
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Processing Status & Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Execution Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStartExtraction}
                disabled={items.length === 0}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all hover:shadow-lg hover:shadow-rose-600/30 active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Batch Extraction</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleStopExtraction}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors"
                >
                  <span>Stop</span>
                </button>
              </>
            )}

            {errorCount > 0 && !isRunning && (
              <button
                onClick={handleRetryFailed}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-xl text-xs sm:text-sm border border-rose-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed ({errorCount})</span>
              </button>
            )}

            <button
              onClick={handleAddRow}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Row</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={isRunning || items.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 font-medium rounded-xl text-xs sm:text-sm transition-colors disabled:opacity-40"
              title="Clear table"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>

          {/* Quality & Formula Mode Options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Resolution Selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Image Size:</span>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as ImageResolution)}
                className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              >
                <option value="superZoom">Super Zoom (1117×1400 px) ★</option>
                <option value="standard">Standard (473×593 px)</option>
                <option value="thumbnail">Listing (288×360 px)</option>
              </select>
            </div>

            {/* Formula Style Toggle */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Column 3 Display:</span>
              <select
                value={formulaStyle}
                onChange={(e) => setFormulaStyle(e.target.value as FormulaStyle)}
                className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              >
                <option value="raw">Raw CDN Image Link</option>
                <option value="sheets">Google Sheets =IMAGE()</option>
                <option value="excel">Excel 365 =IMAGE()</option>
              </select>
            </div>
          </div>
        </div>

        {/* Progress Bar & Status Counters */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-slate-800">
                {totalCount} Total Items
              </span>
              <span className="text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{completedCount} Extracted</span>
              </span>
              {errorCount > 0 && (
                <span className="text-rose-600 font-medium flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorCount} Failed</span>
                </span>
              )}
              {pendingCount > 0 && isRunning && (
                <span className="text-amber-600 font-medium flex items-center space-x-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{pendingCount} In Progress</span>
                </span>
              )}
            </div>

            <div className="text-slate-500 font-mono font-medium">
              {progressPercent}% Complete
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                errorCount > 0 && completedCount === 0
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-rose-500 to-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:px-6 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              CSV Data Table ({items.length} rows)
            </h3>
          </div>

          {/* Quick Copy / Export Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                copyTsvToClipboard(items, formulaStyle);
                showToast('Copied table to clipboard for Excel / Google Sheets');
              }}
              disabled={items.length === 0}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-40"
              title="Copy tab-separated table to paste directly into Google Sheets or Excel"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy for Sheets/Excel</span>
            </button>

            <button
              onClick={() => {
                exportProcessedCsv(items, false, formulaStyle);
                showToast('Downloaded processed 3-column CSV');
              }}
              disabled={completedCount === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40"
              title="Export exact 3 columns: SKU, Product Link, Image Link"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (3 Columns)</span>
            </button>

            <button
              onClick={() => {
                exportProcessedCsv(items, true, formulaStyle);
                showToast('Downloaded CSV with =IMAGE() formula column');
              }}
              disabled={completedCount === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40 hidden md:inline-flex"
              title="Export with 4th column for =IMAGE() formula"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Export with Formula Col</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No items in batch table</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload a CSV file, paste rows, or click below to load the 3 sample bath mats from your brief.
            </p>
            <div className="pt-2">
              <button
                onClick={handleLoadSamples}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs border border-rose-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 3 Sample Items</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-16 text-center">Preview</th>
                  <th className="py-3 px-3 min-w-[200px]">SKU / Product Title</th>
                  <th className="py-3 px-3 min-w-[250px]">AJIO Product Link</th>
                  <th className="py-3 px-3 min-w-[280px]">
                    {formulaStyle === 'raw'
                      ? 'Image Link (CDN URL)'
                      : formulaStyle === 'sheets'
                      ? 'Google Sheets =IMAGE() Formula'
                      : 'Excel 365 =IMAGE() Formula'}
                  </th>
                  <th className="py-3 px-3 w-28 text-center">Status</th>
                  <th className="py-3 px-3 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => {
                  const displayValue = item.imageLink
                    ? generateFormula(item.imageLink, formulaStyle)
                    : '';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Thumbnail Preview */}
                      <td className="py-2.5 px-3 text-center">
                        <div
                          onClick={() => item.imageLink && onViewImage(item)}
                          className={`w-10 h-12 mx-auto rounded-lg border overflow-hidden flex items-center justify-center transition-transform ${
                            item.imageLink
                              ? 'cursor-pointer hover:scale-105 border-slate-200 shadow-2xs bg-white'
                              : 'bg-slate-100 border-dashed border-slate-200'
                          }`}
                        >
                          {item.imageLink ? (
                            <img
                              src={item.imageLink}
                              alt={item.sku}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : item.status === 'processing' ? (
                            <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">—</span>
                          )}
                        </div>
                      </td>

                      {/* SKU (Editable) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => handleUpdateRow(item.id, 'sku', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-hidden text-slate-900 font-medium transition-all"
                        />
                        {item.productTitle && item.productTitle !== item.sku && (
                          <div className="text-[10px] text-slate-400 px-2 line-clamp-1">
                            AJIO: {item.productTitle}
                          </div>
                        )}
                      </td>

                      {/* AJIO Product Link (Editable) */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={item.productLink}
                            onChange={(e) => handleUpdateRow(item.id, 'productLink', e.target.value)}
                            className="w-full bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-hidden text-slate-700 font-mono text-[11px] truncate transition-all"
                          />
                          {item.productLink && (
                            <a
                              href={item.productLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Open in AJIO"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Image Link / Formula Output */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {displayValue ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              readOnly
                              value={displayValue}
                              className={`w-full px-2 py-1 rounded border text-[11px] truncate select-all focus:outline-hidden ${
                                formulaStyle !== 'raw'
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(displayValue);
                                showToast(`Copied row ${index + 1} link/formula`);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              title="Copy link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={item.imageLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Open image in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-sans text-xs">
                            {item.status === 'processing'
                              ? 'Extracting CDN image...'
                              : item.status === 'error'
                              ? item.errorMessage || 'Failed'
                              : 'Waiting for extraction...'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'success' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 mr-0.5" />
                            Extracted
                          </span>
                        ) : item.status === 'processing' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <Loader2 className="w-3 h-3 mr-0.5 animate-spin" />
                            Fetching
                          </span>
                        ) : item.status === 'error' ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                            title={item.errorMessage}
                          >
                            <AlertCircle className="w-3 h-3 mr-0.5" />
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 mr-0.5" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {item.imageLink && (
                            <button
                              onClick={() => onViewImage(item)}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="Preview High-Res Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paste Data Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Paste CSV / Spreadsheet Table Data</span>
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste comma-separated or tab-separated data directly from Excel or Google Sheets. The first two columns should be <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">SKU</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">Product Link</code>.
            </p>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`SKU,Product Link,Image Link\nShower Mat Chocolate 17x26 Inch,https://www.ajio.com/p/466292960001,\nShower Mat Grey 17x26 Inch,https://www.ajio.com/p/466292939001,`}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                Import Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
