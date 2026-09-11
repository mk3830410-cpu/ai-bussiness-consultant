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
  Sparkles
} from 'lucide-react';
import { SavedStrategy } from '../types';

interface SavedStrategiesViewProps {
  strategies: SavedStrategy[];
  onOpenStrategy: (strategy: SavedStrategy) => void;
  onRenameStrategy: (id: string, newName: string) => void;
  onUpdateStatus: (id: string, newStatus: SavedStrategy['status']) => void;
  onDeleteStrategy: (id: string) => void;
  onDuplicateStrategy?: (id: string) => void;
  onCreateNew: () => void;
  onExportPdf?: (strategy: SavedStrategy) => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filtered = strategies.filter((item) => {
    const matchesSearch = 
      item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.inputs?.businessIdea || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-indigo-500/20 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

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
            const statusInfo = getStatusBadge(strategy.status);
            const score = strategy.score || 80;
            const isEditing = editingId === strategy.id;
            const createdAtDate = new Date(strategy.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const updatedAtDate = strategy.updatedAt ? new Date(strategy.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : createdAtDate;

            return (
              <div
                key={strategy.id}
                onClick={() => onOpenStrategy(strategy)}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[150px]">
                      {strategy.industry}
                    </span>

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
                      value={strategy.status}
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
                        title="Download Strategy Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDuplicateStrategy && (
                      <button
                        onClick={() => onDuplicateStrategy(strategy.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Duplicate Strategy"
                      >
                        <Copy className="w-3.5 h-3.5" />
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
    </div>
  );
};

export default SavedStrategiesView;
