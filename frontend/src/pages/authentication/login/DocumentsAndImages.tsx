"use client";

import { useRef, useState } from "react";

interface UploadedFile {
  id: string;
  name: string;
  sizeMB: string;
}

const TOTAL_STORAGE_GB = 5;

interface StoragePlan {
  gb: number;
  price: string;
  description: string;
  isCurrent?: boolean;
}

const STORAGE_PLANS: StoragePlan[] = [
  { gb: 5, price: "$19.99", description: "Perfect for larger files and media", isCurrent: true },
  { gb: 10, price: "$29.99", description: "Maximum capacity for extensive archives" },
  { gb: 15, price: "$39.99", description: "Maximum capacity for extensive archives" },
  { gb: 20, price: "$49.99", description: "Maximum capacity for extensive archives" },
  { gb: 25, price: "$79.99", description: "Enterprise-level storage solution" },
];

const PROCESSING_STEPS = [
  "Compressing files into a single archive...",
  "Encrypting your vault...",
  "Splitting into secure fragments...",
  "Uploading to storage servers...",
  "Updating secure database...",
  "Cleaning up — files secured!",
];

// ── Alert Modal ───────────────────────────────────────────────────────────────

function AlertModal({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-500 text-lg">ℹ️</span>
          <h4 className="font-bold text-gray-800 text-sm">Notice</h4>
        </div>
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ── Order More Storage Modal ──────────────────────────────────────────────────

function OrderStorageModal({ currentGB, usedGB, onClose, onPurchaseAlert }: {
  currentGB: number;
  usedGB: number;
  onClose: () => void;
  // FIX: Pass alert handler up instead of using alert()
  onPurchaseAlert: (msg: string) => void;
}) {
  // FIX: Purchase button now shows modal instead of browser alert()
  const handlePurchase = (plan: StoragePlan) => {
    onClose();
    onPurchaseAlert(`Your request to purchase ${plan.gb} GB storage at ${plan.price} has been received. Please contact support to complete this transaction.`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg border border-blue-200 rounded-xl shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-bold text-gray-900">Order Additional Storage</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Current Storage: <span className="text-blue-600 font-semibold">{currentGB} GB</span>
            {" | "}Used: <span className="font-semibold">{usedGB.toFixed(2)} GB</span>
          </p>
        </div>

        <div className="px-6 space-y-2 pb-3">
          {STORAGE_PLANS.map(plan => (
            <div
              key={plan.gb}
              className={`flex items-center justify-between gap-4 border rounded-xl px-4 py-3 ${plan.isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <svg className="w-7 h-7 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3" />
                  <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {plan.gb} GB Storage
                    {plan.isCurrent && <span className="ml-1.5 text-blue-600 font-bold text-xs">(Current Plan)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {/* FIX: Removed /mo — storage is not billed monthly in this context */}
                <span className="text-sm font-bold text-gray-800">{plan.price}</span>
                {!plan.isCurrent && (
                  <button
                    onClick={() => handlePurchase(plan)}
                    className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Purchase
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-4 border border-red-200 bg-red-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-red-500 text-sm">⚠</span>
            <p className="text-xs font-bold text-red-500">Important Information</p>
          </div>
          <ul className="space-y-1 text-xs text-gray-700">
            <li className="flex items-start gap-1.5"><span className="text-red-400 font-bold shrink-0">•</span>Storage upgrades will be added to your next invoice.</li>
            <li className="flex items-start gap-1.5"><span className="text-red-400 font-bold shrink-0">•</span>Credits / Refunds are not available once purchased.</li>
            <li className="flex items-start gap-1.5"><span className="text-red-400 font-bold shrink-0">•</span>Downgrading storage requires removing files to fit within the new limit.</li>
          </ul>
        </div>

        <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-3 transition-colors cursor-pointer">
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DocumentsAndImages() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingDone, setProcessingDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // FIX: Alert modal state for purchase confirmation
  const [alertMessage, setAlertMessage] = useState("");

  const usedGB = files.reduce((acc, f) => acc + parseFloat(f.sizeMB) / 1024, 0);
  const usedPercent = Math.min((usedGB / TOTAL_STORAGE_GB) * 100, 100);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      sizeMB: (f.size / (1024 * 1024)).toFixed(2),
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setProcessingDone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setProcessingDone(false);
  };

  const handleSaveAndProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessingDone(false);

    for (const step of PROCESSING_STEPS) {
      setProcessingStep(step);
      await new Promise(res => setTimeout(res, 900));
    }

    setIsProcessing(false);
    setProcessingDone(true);
    setProcessingStep("");
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬";
    if (["mp3", "wav", "aac"].includes(ext)) return "🎵";
    if (["doc", "docx"].includes(ext)) return "📝";
    return "📁";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 text-black space-y-6">

      {/* ── Alert Modal ── */}
      <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />

      {/* ── Page Header ── */}
      <div>
        <h1 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
          style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Documents &amp; Images</h1>
        <p className="text-sm text-gray-500 mt-4">Upload and manage files stored in your encrypted vault</p>
      </div>

      {/* ── Upload Zone ── */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-14 cursor-pointer transition-all duration-200 ${isDragOver ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"}`}
      >
        <div className="mb-4 bg-blue-500 rounded-xl p-3 shadow-md">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">
          {isDragOver ? "Release to upload files" : "Drop files here or click to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-1">Supports all file types — PDF, images, video, audio, documents</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* ── Storage Info ── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="text-purple-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">Storage Information</p>
          </div>
          <button
            onClick={() => setShowStorageModal(true)}
            className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors tracking-wide cursor-pointer"
          >
            ORDER MORE STORAGE
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Total storage used:</span>
          <span>{TOTAL_STORAGE_GB} GB total</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${usedPercent > 0 ? Math.max(usedPercent, 1) : 0.5}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{usedGB.toFixed(2)} GB used of {TOTAL_STORAGE_GB} GB</p>
      </div>

      {/* ── File List ── */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Files to be protected ({files.length})
        </h3>
        {files.length === 0 ? (
          <div className="border border-dashed border-gray-200 bg-gray-50 rounded-xl py-6 text-center text-xs text-gray-400">
            No files uploaded yet
          </div>
        ) : (
          <div className="border border-gray-200 bg-white rounded-xl divide-y divide-gray-100">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl shrink-0">{getFileIcon(f.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.sizeMB} MB</p>
                </div>
                <button
                  onClick={() => handleRemove(f.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0 text-lg font-bold leading-none cursor-pointer"
                  aria-label={`Remove ${f.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SAVE / Process Files Button ── */}
      {files.length > 0 && (
        <div>
          <button
            onClick={handleSaveAndProcess}
            disabled={isProcessing || processingDone}
            className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${processingDone
                ? "bg-green-100 border border-green-400 text-green-700 cursor-default"
                : isProcessing
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-white cursor-pointer shadow-sm"
              }`}
          >
            {processingDone
              ? "✓ Files Secured Successfully"
              : isProcessing
                ? "Processing..."
                : "🔒 Save & Secure Files"}
          </button>

          {isProcessing && processingStep && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {processingStep}
            </div>
          )}
        </div>
      )}

      {/* ── Recommendation Note ── */}
      <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-5">
        <div className="flex items-start gap-2">
          <span className="text-yellow-500 mt-0.5 shrink-0">💡</span>
          <div>
            <h4 className="font-bold text-sm text-yellow-800 mb-1">Recommendation</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              We recommend you include a letter of introduction to explain to the Press or your Trusted
              Recipients the importance of the information you have collected and also include what your wishes are.
            </p>
          </div>
        </div>
      </div>

      {/* ── File Changes Note — FIX: updated text per client spec ── */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">📋</span>
          <div>
            <h4 className="font-bold text-sm text-blue-800 mb-1">File Changes</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              To add, remove, or modify your documents, you must re-upload the entire file set. This ensures
              the integrity of your secure package. Please ensure all intended files are included before saving.
            </p>
          </div>
        </div>
      </div>

      {/* ── Order Storage Modal ── */}
      {showStorageModal && (
        <OrderStorageModal
          currentGB={TOTAL_STORAGE_GB}
          usedGB={usedGB}
          onClose={() => setShowStorageModal(false)}
          onPurchaseAlert={(msg) => setAlertMessage(msg)}
        />
      )}

    </div>
  );
}