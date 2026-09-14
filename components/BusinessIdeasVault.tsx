import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Trash2, 
  Sparkles, 
  Tag, 
  Calendar, 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  Compass, 
  Archive, 
  Flame,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { BusinessIdeaItem, BusinessIdeaStatus } from '../types';

interface BusinessIdeasVaultProps {
  ideas: BusinessIdeaItem[];
  onSaveIdea: (idea: BusinessIdeaItem) => void;
  onDeleteIdea: (id: string) => void;
  onAnalyzeIdea: (idea: BusinessIdeaItem) => void;
}

const STATUS_CONFIG: Record<BusinessIdeaStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  new: {
    label: 'New Idea',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Flame,
  },
  exploring: {
    label: 'Exploring',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: Compass,
  },
  validated: {
    label: 'Validated',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  archived: {
    label: 'Archived',
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    icon: Archive,
  },
};

export const BusinessIdeasVault: React.FC<BusinessIdeasVaultProps> = ({
  ideas,
  onSaveIdea,
  onDeleteIdea,
  onAnalyzeIdea,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('SaaS & Software');
  const [status, setStatus] = useState<BusinessIdeaStatus>('new');
  const [tagInput, setTagInput] = useState('');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Extract unique industries from ideas
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    (ideas || []).forEach(i => {
      if (i && i.industry) set.add(i.industry);
    });
    return Array.from(set).sort();
  }, [ideas]);

  // Filtered Ideas based on Search, Industry, and Status
  const filteredIdeas = useMemo(() => {
    return (ideas || []).filter((idea): idea is BusinessIdeaItem => {
      if (!idea) return false;

      // 1. Search by name, description, or tags
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (idea.title || '').toLowerCase().includes(q);
        const matchDesc = (idea.description || '').toLowerCase().includes(q);
        const matchTags = idea.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      // 2. Filter by Industry
      if (selectedIndustry !== 'ALL' && idea.industry !== selectedIndustry) {
        return false;
      }

      // 3. Filter by Status
      const ideaStatus = idea.status || 'new';
      if (selectedStatus !== 'ALL' && ideaStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [ideas, searchQuery, selectedIndustry, selectedStatus]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedIndustry !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('ALL');
    setSelectedStatus('ALL');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newIdea: BusinessIdeaItem = {
      id: `idea_${Date.now().toString(36)}`,
      title: title.trim(),
      description: description.trim(),
      industry,
      status,
      tags: tags.length > 0 ? tags : ['Startup'],
      createdAt: Date.now(),
    };

    onSaveIdea(newIdea);
    setTitle('');
    setDescription('');
    setIndustry('SaaS & Software');
    setStatus('new');
    setTagInput('');
    setShowAddModal(false);
  };

  const handleStatusChange = (idea: BusinessIdeaItem, newStatus: BusinessIdeaStatus) => {
    onSaveIdea({
      ...idea,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <span>Business Idea Vault</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Capture, organize, and prioritize your startup ideas before running in-depth analyses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Idea</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      {ideas.length > 0 && (
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search by Name/Keywords */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas by name, keyword, or tag..."
                className="w-full pl-10 pr-9 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Industry */}
            <div className="sm:col-span-3 relative">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="ALL">All Industries</option>
                {availableIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Filter by Status */}
            <div className="sm:col-span-3 relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="new">New Idea</option>
                <option value="exploring">Exploring</option>
                <option value="validated">Validated</option>
                <option value="archived">Archived</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Filter Status Pills & Results Counter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-700/50 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 font-medium mr-1">Filter status:</span>
              {(['ALL', 'new', 'exploring', 'validated', 'archived'] as const).map((st) => {
                const isActive = selectedStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : STATUS_CONFIG[st].label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                Showing <strong className="text-white font-semibold">{filteredIdeas.length}</strong> of{' '}
                <strong className="text-white font-semibold">{ideas.length}</strong> {ideas.length === 1 ? 'idea' : 'ideas'}
              </span>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {ideas.length === 0 ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Your Vault is Empty</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            Keep track of all your startup concepts, problem observations, and market gaps in one place.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Idea</span>
          </button>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-10 text-center">
          <Search className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No matching ideas found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">
            No business ideas match your current search query or filter combination.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Search & Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => {
            const currentStatus = (idea?.status || 'new') as BusinessIdeaStatus;
            const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new;
            const StatusIcon = statusMeta.icon;

            return (
              <div
                key={idea.id}
                className="bg-gray-800/90 border border-gray-700/80 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200 shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Industry, Status, and Delete */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {idea.industry}
                      </span>

                      {/* Status Selector Badge */}
                      <div className="relative inline-block">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(idea, e.target.value as BusinessIdeaStatus)}
                          className={`text-[11px] font-semibold pl-2 pr-5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border} appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400`}
                          title="Click to update status"
                        >
                          <option value="new">New Idea</option>
                          <option value="exploring">Exploring</option>
                          <option value="validated">Validated</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Idea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{idea.title}</h3>
                  <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-3 mb-4">
                    {idea.description}
                  </p>

                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {idea.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900 text-gray-400 border border-gray-700 flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-gray-500" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(idea.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <button
                    onClick={() => onAnalyzeIdea(idea)}
                    className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Strategy</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Idea Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add Idea to Vault</h3>
            <p className="text-xs text-gray-400 mb-6">
              Jot down a business concept or market observation to evaluate later.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Idea Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Content Repurposer for Podcasters"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Industry / Category
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. SaaS, MediaTech, Healthcare"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BusinessIdeaStatus)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="new">New Idea</option>
                    <option value="exploring">Exploring</option>
                    <option value="validated">Validated</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Description & Value Hypothesis
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem does it solve? Who is the customer? Why would they pay?"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="B2B, AI, Audio, Bootstrap"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessIdeasVault;
