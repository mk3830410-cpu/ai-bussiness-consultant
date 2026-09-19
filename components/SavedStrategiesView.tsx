import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Trash2, 
  ExternalLink, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Filter, 
  Calendar, 
  Award, 
  Building, 
  Download,
  Copy,
  Clock,
  Sparkles,
  ArrowLeftRight,
  FileCode,
  Archive,
  DownloadCloud,
  CheckSquare,
  Square,
  Lock,
  Crown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { SavedStrategy } from '../types';
import { StrategyComparison } from './StrategyComparison';
import { downloadStrategyMarkdown } from '../services/markdownExportService';
import { useAuth } from '../services/AuthContext';
import { useToast } from './Toast';
import { exportSavedStrategiesToZip, BulkExportProgress } from '../services/bulkExportService';

interface SavedStrategiesViewProps {
  strategies: SavedStrategy[];
  onOpenStrategy: (strategy: SavedStrategy) => void;
  onRenameStrategy: (id: string, newName: string) => void;
  onUpdateStatus: (id: string, newStatus: SavedStrategy['status']) => void;
  onDeleteStrategy: (id: string) => void;
  onDuplicateStrategy?: (id: string) => void;
  onCreateNew: () => void;
  onExportPdf?: (strategy: SavedStrategy) => void;
  onUpgradePro?: () => void;
}

export const SavedStrategiesView: React.FC<SavedStrategiesViewProps> = ({
  strategies,
  onOpenStrategy,
  onRenameStrategy,
  onUpdateStatus,
  onDeleteStrategy,
  onDuplicateStrategy,
  onCreateNew,
  onExportPdf,
  onUpgradePro,
}) => {
  const { user, isPro } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareInitialA, setCompareInitialA] = useState<string | undefined>();
  const [compareInitialB, setCompareInitialB] = useState<string | undefined>();

  // Bulk ZIP Export states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [exportProgress, setExportProgress] = useState<BulkExportProgress | null>(null);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);

  const filtered = (strategies || []).filter((item): item is SavedStrategy => {
    if (!item) return false;
    const bName = item.businessName || '';
    const ind = item.industry || '';
    const idea = item.inputs?.businessIdea || '';
    const matchesSearch = 
      bName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemStatus = item.status || 'validated';
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleSelectStrategy = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleTriggerBulkExport = async (customSelection?: SavedStrategy[]) => {
    const targets = customSelection || (
      selectedIds.size > 0 
        ? strategies.filter((s) => selectedIds.has(s.id))
        : strategies
    );

    if (targets.length === 0) {
      showToast('No saved strategies available to export.', 'info');
      return;
    }

    // Check if user is Pro
    if (!isPro) {
      setShowProUpgradeModal(true);
      return;
    }

    try {
      showToast(`Compiling ${targets.length} strategy reports into ZIP archive...`, 'info');
      await exportSavedStrategiesToZip(targets, {
        userEmail: user?.email,
        onProgress: (p) => setExportProgress(p),
      });
      showToast(`ZIP export complete! Downloaded ${targets.length} strategy PDFs.`, 'success');
      setTimeout(() => {
        setExportProgress(null);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }, 1500);
    } catch (err: any) {
      console.error('Bulk export failed:', err);
      showToast(`Export failed: ${err?.message || 'Error generating archive'}`, 'error');
      setExportProgress(null);
    }
  };

  const handleStartRename = (strategy: SavedStrategy, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(strategy.id);
    setEditingName(strategy.businessName);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      onRenameStrategy(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const getStatusBadge = (status: SavedStrategy['status']) => {
    switch (status) {
      case 'validated':
        return { label: 'Validated', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'in_review':
        return { label: 'In Review', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'launched':
        return { label: 'Live / Launched', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      default:
        return { label: 'Draft', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  if (comparing) {
    return (
      <div className="space-y-6">
        <StrategyComparison
          strategies={strategies}
          initialStrategyAId={compareInitialA}
          initialStrategyBId={compareInitialB}
          onClose={() => setComparing(false)}
          onOpenStrategy={(st) => {
            setComparing(false);
            onOpenStrategy(st);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-indigo-400" />
            <span>My Business Strategies</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Cloud-persisted market blueprints, SWOT analyses, and financial projections in Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {strategies.length > 0 && (
            <button
              id="bulk-export-zip-btn"
              onClick={() => handleTriggerBulkExport()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-purple-500/25 flex items-center gap-2 shrink-0 cursor-pointer"
              title={isPro ? "Download all saved strategies as a single ZIP of PDFs" : "Pro Feature: Bulk export all strategies as a single ZIP archive"}
            >
              <Archive className="w-4 h-4 text-white" />
              <span>Bulk Export (ZIP)</span>
              {!isPro ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-300" />
                  PRO
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  {selectedIds.size > 0 ? `${selectedIds.size}` : `${strategies.length}`}
                </span>
              )}
            </button>
          )}

          {strategies.length > 0 && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds(new Set());
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isSelectionMode 
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500' 
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle multi-strategy selection"
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">{isSelectionMode ? 'Cancel Selection' : 'Select'}</span>
            </button>
          )}

          {strategies.length >= 2 && (
            <button
              onClick={() => {
                setCompareInitialA(strategies[0]?.id);
                setCompareInitialB(strategies[1]?.id);
                setComparing(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500/50 font-semibold rounded-xl text-sm transition-all duration-200 shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
              title="Compare two strategies side-by-side in split screen"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span>Split-Screen Compare</span>
            </button>
          )}

          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-indigo-500/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Selection Mode Toolbar */}
      {isSelectionMode && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-indigo-950/20">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 cursor-pointer bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select All ({filtered.length})</span>
                </>
              )}
            </button>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold text-slate-200">
              {selectedIds.size} of {filtered.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={selectedIds.size === 0}
              onClick={() => handleTriggerBulkExport()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Export {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Selection'} as ZIP</span>
            </button>
          </div>
        </div>
      )}

      {/* Controls: Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search strategies by business name, keyword, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="validated">Validated</option>
            <option value="in_review">In Review</option>
            <option value="launched">Live / Launched</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid of Strategies */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Strategies Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'No business strategies matched your current filter criteria. Try adjusting your search term.'
              : 'You have not created any startup strategy analyses yet. Turn your first business idea into an investor-grade blueprint in seconds.'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Analysis</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((strategy) => {
            const statusInfo = getStatusBadge(strategy?.status || 'validated');
            const score = strategy?.score || 80;
            const isEditing = editingId === strategy?.id;
            const createdAtDate = strategy?.createdAt ? new Date(strategy.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
            const updatedAtDate = strategy?.updatedAt ? new Date(strategy.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : createdAtDate;

            const isSelected = selectedIds.has(strategy.id);

            return (
              <div
                key={strategy.id}
                onClick={() => {
                  if (isSelectionMode) {
                    handleToggleSelectStrategy(strategy.id);
                  } else {
                    onOpenStrategy(strategy);
                  }
                }}
                className={`bg-slate-900/90 hover:bg-slate-900 border rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/30'
                    : 'border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectStrategy(strategy.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
                          aria-label="Select strategy for bulk export"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-400 fill-indigo-500/20" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      )}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[150px]">
                        {strategy.industry}
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Title or Rename Field */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-base font-bold text-white flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(strategy.id, e)}
                        className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1.5 text-rose-400 hover:bg-slate-800 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {strategy.businessName}
                      </h3>
                      <button
                        onClick={(e) => handleStartRename(strategy, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity"
                        title="Rename Strategy"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Summary / Idea snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {strategy.inputs?.businessIdea || strategy.inputs?.userInput || 'No description recorded.'}
                  </p>

                  {/* Metric Chips with both Created & Updated dates */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Opportunity</span>
                        <span className="text-xs font-bold text-white">{score}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Created</span>
                        <span className="text-xs font-medium text-slate-300 truncate block">{createdAtDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Last updated snippet */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1 mb-3">
                    <Clock size={12} className="text-slate-600" />
                    <span>Updated: {updatedAtDate}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={strategy?.status || 'validated'}
                      onChange={(e) => onUpdateStatus(strategy.id, e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="validated">Validated</option>
                      <option value="in_review">In Review</option>
                      <option value="launched">Live</option>
                    </select>

                    {onExportPdf && (
                      <button
                        onClick={() => onExportPdf(strategy)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Download Strategy Report (PDF)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        downloadStrategyMarkdown(strategy.analysisResult, 'deep', {
                          conceptTitle: strategy.businessName,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Export as Markdown (.md) for Notion, Obsidian, Jira, or Linear"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>

                    {onDuplicateStrategy && (
                      <button
                        onClick={() => onDuplicateStrategy(strategy.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Duplicate Strategy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {strategies.length >= 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareInitialA(strategy.id);
                          const other = strategies.find(s => s.id !== strategy.id);
                          setCompareInitialB(other?.id);
                          setComparing(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Compare with another strategy"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDeleteStrategy(strategy.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Strategy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenStrategy(strategy)}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pro Upgrade Required Modal for Bulk Export */}
      {showProUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowProUpgradeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4">
              <Archive className="w-6 h-6 text-purple-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Founder Pro Feature</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              Bulk PDF ZIP Export
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Export all your saved strategy blueprints into a single organized ZIP package of investor-ready PDFs with an automated portfolio manifest.
            </p>

            <div className="mt-5 space-y-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-click bundle download of all your analyzed startups</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Executive portfolio manifest text file with scores & dates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High-resolution PDF formatting ready for investor review</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowProUpgradeModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowProUpgradeModal(false);
                  if (onUpgradePro) {
                    onUpgradePro();
                  } else {
                    showToast('Please visit the Pricing tab to upgrade to Founder Pro.', 'info');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Progress Modal */}
      {exportProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">
                {exportProgress.status === 'zipping'
                  ? 'Compressing ZIP Archive...'
                  : 'Compiling Strategy PDFs...'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {exportProgress.currentName}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (exportProgress.current / Math.max(exportProgress.total, 1)) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>
                Processed {exportProgress.current} of {exportProgress.total} reports
              </span>
              <span className="text-indigo-400 font-bold">
                {Math.round(
                  (exportProgress.current / Math.max(exportProgress.total, 1)) * 100
                )}
                %
              </span>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Please keep this tab open while generating high-res vector PDFs...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedStrategiesView;
