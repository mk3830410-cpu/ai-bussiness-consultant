import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  SlidersHorizontal,
  Download,
  FileJson,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ChevronDown,
  Edit3,
  Check,
  Hash
} from 'lucide-react';
import { BusinessIdeaItem, BusinessIdeaStatus } from '../types';
import { useToast } from './Toast';

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

// Popular category suggestions to help users quickly categorize ideas
const PRESET_CATEGORIES = [
  'SaaS',
  'Mobile App',
  'Fintech',
  'AI / ML',
  'B2B',
  'Marketplace',
  'E-Commerce',
  'HealthTech',
  'Creator Economy',
  'EdTech',
  'CleanTech',
  'Developer Tools',
];

export const BusinessIdeasVault: React.FC<BusinessIdeasVaultProps> = ({
  ideas,
  onSaveIdea,
  onDeleteIdea,
  onAnalyzeIdea,
}) => {
  const { showToast } = useToast();

  // Modal State for Add & Edit
  const [showModal, setShowModal] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('SaaS & Software');
  const [status, setStatus] = useState<BusinessIdeaStatus>('new');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Idea Selection State for Bulk / Targeted Export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Inline Tag Input State on Cards
  const [inlineTagIdeaId, setInlineTagIdeaId] = useState<string | null>(null);
  const [inlineTagValue, setInlineTagValue] = useState('');

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  // Clean up selectedIds if ideas are removed
  useEffect(() => {
    const validIds = new Set((ideas || []).map(i => i.id));
    setSelectedIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [ideas]);

  // Extract unique industries from ideas
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    (ideas || []).forEach(i => {
      if (i && i.industry) set.add(i.industry);
    });
    return Array.from(set).sort();
  }, [ideas]);

  // Extract unique tags and their frequency across all ideas
  const allUniqueTags = useMemo(() => {
    const counts: Record<string, number> = {};
    (ideas || []).forEach(idea => {
      if (idea && Array.isArray(idea.tags)) {
        idea.tags.forEach(t => {
          const clean = t.trim();
          if (clean) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [ideas]);

  // Filtered Ideas based on Search bar (title, industry, description keywords), Tags, Industry, and Status
  const filteredIdeas = useMemo(() => {
    return (ideas || []).filter((idea): idea is BusinessIdeaItem => {
      if (!idea) return false;

      // 1. Search bar filtering: Title, Industry, or Description keywords (also matches tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (idea.title || '').toLowerCase().includes(q);
        const matchDesc = (idea.description || '').toLowerCase().includes(q);
        const matchIndustry = (idea.industry || '').toLowerCase().includes(q);
        const matchTags = idea.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchIndustry && !matchTags) return false;
      }

      // 2. Tag filter
      if (selectedTag !== 'ALL') {
        const hasTag = idea.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // 3. Filter by Industry
      if (selectedIndustry !== 'ALL' && idea.industry !== selectedIndustry) {
        return false;
      }

      // 4. Filter by Status
      const ideaStatus = idea.status || 'new';
      if (selectedStatus !== 'ALL' && ideaStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [ideas, searchQuery, selectedTag, selectedIndustry, selectedStatus]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTag !== 'ALL' || selectedIndustry !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag('ALL');
    setSelectedIndustry('ALL');
    setSelectedStatus('ALL');
  };

  // Selection handlers
  const toggleSelectIdea = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredIdeas.map(i => i.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Determine which ideas to export (selected items, or all filtered items if none selected)
  const getIdeasToExport = (): BusinessIdeaItem[] => {
    if (selectedIds.size > 0) {
      return (ideas || []).filter(i => selectedIds.has(i.id));
    }
    return filteredIdeas;
  };

  // Export as Formatted JSON
  const handleExportJSON = () => {
    const exportItems = getIdeasToExport();
    if (exportItems.length === 0) {
      showToast('No business ideas available to export', 'error');
      return;
    }

    const exportPayload = {
      metadata: {
        application: 'StratIQ Business Idea Vault',
        exportedAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleString(),
        totalExported: exportItems.length,
        selectionScope: selectedIds.size > 0 ? 'selected_ideas' : 'filtered_view',
      },
      ideas: exportItems.map(idea => ({
        id: idea.id,
        title: idea.title,
        industry: idea.industry,
        status: idea.status || 'new',
        description: idea.description,
        tags: idea.tags || [],
        createdAt: idea.createdAt,
        createdDate: new Date(idea.createdAt).toLocaleDateString(),
      })),
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stratiq-business-ideas-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${exportItems.length} business idea${exportItems.length === 1 ? '' : 's'} as JSON`, 'success', 'download');
    setIsExportMenuOpen(false);
  };

  // Export as Formatted CSV (RFC 4180 compliant)
  const handleExportCSV = () => {
    const exportItems = getIdeasToExport();
    if (exportItems.length === 0) {
      showToast('No business ideas available to export', 'error');
      return;
    }

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = ['ID', 'Title', 'Industry', 'Status', 'Description', 'Tags', 'Created Date', 'Created Timestamp'];
    const rows = exportItems.map(idea => [
      escapeCSV(idea.id),
      escapeCSV(idea.title),
      escapeCSV(idea.industry),
      escapeCSV(idea.status || 'new'),
      escapeCSV(idea.description),
      escapeCSV((idea.tags || []).join(', ')),
      escapeCSV(new Date(idea.createdAt).toLocaleDateString()),
      escapeCSV(idea.createdAt),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stratiq-business-ideas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${exportItems.length} business idea${exportItems.length === 1 ? '' : 's'} as CSV`, 'success', 'download');
    setIsExportMenuOpen(false);
  };

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingIdeaId(null);
    setTitle('');
    setDescription('');
    setIndustry('SaaS & Software');
    setStatus('new');
    setActiveTags(['SaaS']);
    setCustomTagInput('');
    setShowModal(true);
  };

  const handleOpenEditModal = (idea: BusinessIdeaItem) => {
    setEditingIdeaId(idea.id);
    setTitle(idea.title || '');
    setDescription(idea.description || '');
    setIndustry(idea.industry || 'SaaS & Software');
    setStatus(idea.status || 'new');
    setActiveTags(idea.tags ? [...idea.tags] : []);
    setCustomTagInput('');
    setShowModal(true);
  };

  // Tag Management inside Modal
  const handleAddTagToModal = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!activeTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setActiveTags(prev => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTagFromModal = (tagToRemove: string) => {
    setActiveTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Form Submit (Add or Edit)
  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    let finalTags = [...activeTags];
    if (customTagInput.trim()) {
      const extraTags = customTagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      extraTags.forEach(t => {
        if (!finalTags.some(existing => existing.toLowerCase() === t.toLowerCase())) {
          finalTags.push(t);
        }
      });
    }
    if (finalTags.length === 0) {
      finalTags = ['Startup'];
    }

    if (editingIdeaId) {
      const existing = ideas.find(i => i.id === editingIdeaId);
      const updatedIdea: BusinessIdeaItem = {
        id: editingIdeaId,
        title: title.trim(),
        description: description.trim(),
        industry: industry.trim() || 'General',
        status,
        tags: finalTags,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      onSaveIdea(updatedIdea);
      showToast(`Updated "${updatedIdea.title}"`, 'success');
    } else {
      const newIdea: BusinessIdeaItem = {
        id: `idea_${Date.now().toString(36)}`,
        title: title.trim(),
        description: description.trim(),
        industry: industry.trim() || 'General',
        status,
        tags: finalTags,
        createdAt: Date.now(),
      };
      onSaveIdea(newIdea);
      showToast(`Added "${newIdea.title}" to vault`, 'success');
    }

    setShowModal(false);
  };

  // Status Change Quick Update
  const handleStatusChange = (idea: BusinessIdeaItem, newStatus: BusinessIdeaStatus) => {
    onSaveIdea({
      ...idea,
      status: newStatus,
      updatedAt: Date.now(),
    });
    showToast(`Status changed to ${STATUS_CONFIG[newStatus].label}`, 'info');
  };

  // Inline Tag Management on Cards
  const handleAddInlineTag = (idea: BusinessIdeaItem, tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const currentTags = idea.tags || [];
    if (!currentTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      const updatedTags = [...currentTags, trimmed];
      onSaveIdea({
        ...idea,
        tags: updatedTags,
        updatedAt: Date.now(),
      });
      showToast(`Added category tag "${trimmed}"`, 'success');
    }
    setInlineTagValue('');
    setInlineTagIdeaId(null);
  };

  const handleRemoveTagFromIdea = (idea: BusinessIdeaItem, tagToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedTags = (idea.tags || []).filter(t => t !== tagToRemove);
    onSaveIdea({
      ...idea,
      tags: updatedTags,
      updatedAt: Date.now(),
    });
    showToast(`Removed tag "${tagToRemove}"`, 'info');
  };

  const allVisibleSelected = filteredIdeas.length > 0 && filteredIdeas.every(i => selectedIds.has(i.id));
  const someVisibleSelected = filteredIdeas.some(i => selectedIds.has(i.id));

  return (
    <div className="space-y-6 animate-fadeIn" id="business-ideas-vault-container">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <span>Business Idea Vault</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Capture, categorize with tags, prioritize, and export your startup concepts before in-depth validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Button with Formatted JSON / CSV Menu */}
          {ideas.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                id="ideas-export-dropdown-btn"
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white font-semibold rounded-xl text-sm border border-gray-700 transition-all duration-200 shadow-sm flex items-center gap-2"
                title="Export business ideas as formatted JSON or CSV"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>
                  {selectedIds.size > 0 ? `Export (${selectedIds.size} Selected)` : `Export Ideas`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Export Dropdown Menu */}
              {isExportMenuOpen && (
                <div 
                  id="ideas-export-dropdown-menu"
                  className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-2 z-30 animate-fadeIn"
                >
                  <div className="px-3 py-2 border-b border-gray-800">
                    <p className="text-xs font-semibold text-gray-300">Export Business Ideas</p>
                    <p className="text-[11px] text-gray-500">
                      {selectedIds.size > 0 
                        ? `Exporting ${selectedIds.size} individually selected idea${selectedIds.size === 1 ? '' : 's'}` 
                        : `Exporting all ${filteredIdeas.length} currently filtered idea${filteredIdeas.length === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      id="ideas-export-json-btn"
                      onClick={handleExportJSON}
                      className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-gray-800 text-gray-200 hover:text-white transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                        <FileJson className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Export as JSON</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">.json</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Formatted JSON with full schema, tags, and timestamps.
                        </p>
                      </div>
                    </button>

                    <button
                      id="ideas-export-csv-btn"
                      onClick={handleExportCSV}
                      className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-gray-800 text-gray-200 hover:text-white transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Export as CSV</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">.csv</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Spreadsheet file for Excel, Google Sheets, or Airtable.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add New Idea Button */}
          <button
            id="ideas-add-new-btn"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Idea</span>
          </button>
        </div>
      </div>

      {/* Search Bar, Tag Filter & Controls */}
      {ideas.length > 0 && (
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-4 shadow-lg space-y-3.5">
          {/* Top Row: Search Bar, Industry Filter, Status Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Bar: Filters by Title, Industry, or Description Keywords */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="ideas-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas by title, industry, or description keywords..."
                className="w-full pl-10 pr-9 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  id="ideas-clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  title="Clear search text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Industry */}
            <div className="sm:col-span-3 relative">
              <select
                id="ideas-industry-filter"
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
                id="ideas-status-filter"
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

          {/* Tag & Category Filter Bar */}
          <div className="pt-2 border-t border-gray-700/60">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 shrink-0">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Filter by Category / Tag:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-0.5 max-w-full">
                {/* All Tags chip */}
                <button
                  id="tag-filter-all"
                  onClick={() => setSelectedTag('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedTag === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-gray-900/90 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  All Categories ({ideas.length})
                </button>

                {/* Popular / Discovered Tags chips */}
                {allUniqueTags.map(({ tag, count }) => {
                  const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      id={`tag-filter-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedTag(isSelected ? 'ALL' : tag)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm ring-1 ring-indigo-400'
                          : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700/60'
                      }`}
                    >
                      <Hash className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{tag}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-800 text-gray-400'}`}>
                        {count}
                      </span>
                      {isSelected && <X className="w-3 h-3 ml-0.5 hover:text-rose-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row: Selection Controller & Filter Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-700/50 text-xs">
            {/* Selection Toolbar */}
            <div className="flex items-center gap-2.5">
              <button
                id="ideas-select-all-btn"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors font-medium"
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                ) : someVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-300/60" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span>{allVisibleSelected ? 'Deselect All' : `Select All (${filteredIdeas.length})`}</span>
              </button>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {selectedIds.size} of {ideas.length} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-gray-400 hover:text-white underline text-[11px]"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* Results Counter & Reset */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                Showing <strong className="text-white font-semibold">{filteredIdeas.length}</strong> of{' '}
                <strong className="text-white font-semibold">{ideas.length}</strong> {ideas.length === 1 ? 'idea' : 'ideas'}
              </span>

              {hasActiveFilters && (
                <button
                  id="ideas-reset-filters-btn"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg font-medium transition-colors border border-indigo-500/20"
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
            Keep track of all your startup concepts, categorize them by industry or tags (e.g. SaaS, Fintech, Mobile App), and export them whenever you are ready.
          </p>
          <button
            onClick={handleOpenAddModal}
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
            {searchQuery 
              ? `No business ideas matched your search "${searchQuery}".` 
              : 'No business ideas match the active filter criteria.'}
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
            const isSelected = selectedIds.has(idea.id);

            return (
              <div
                key={idea.id}
                id={`idea-card-${idea.id}`}
                className={`bg-gray-800/90 border rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-lg flex flex-col justify-between group relative ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-gray-800' 
                    : 'border-gray-700/80 hover:border-indigo-500/50'
                }`}
              >
                <div>
                  {/* Top Bar: Selection Checkbox, Industry, Status, and Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Selection Checkbox */}
                      <button
                        id={`idea-checkbox-${idea.id}`}
                        onClick={(e) => toggleSelectIdea(idea.id, e)}
                        className={`p-1 rounded-lg transition-colors ${
                          isSelected 
                            ? 'text-indigo-400 hover:text-indigo-300' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                        title={isSelected ? 'Deselect idea for export' : 'Select idea for export'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                        )}
                      </button>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {idea.industry}
                      </span>

                      {/* Status Selector Badge */}
                      <div className="relative inline-block">
                        <select
                          id={`idea-status-select-${idea.id}`}
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

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        id={`idea-edit-btn-${idea.id}`}
                        onClick={() => handleOpenEditModal(idea)}
                        className="p-1.5 text-gray-500 hover:text-indigo-300 rounded-lg transition-colors opacity-70 hover:opacity-100"
                        title="Edit Idea & Tags"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        id={`idea-delete-btn-${idea.id}`}
                        onClick={() => onDeleteIdea(idea.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition-colors opacity-70 hover:opacity-100"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{idea.title}</h3>
                  <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-3 mb-4">
                    {idea.description}
                  </p>

                  {/* Tagging System Section */}
                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {idea.tags && idea.tags.map((t, i) => {
                        const isCurrentFilter = selectedTag.toLowerCase() === t.toLowerCase();
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                              isCurrentFilter
                                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                                : 'bg-gray-900 text-gray-300 border-gray-700/80 hover:border-gray-600'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedTag(isCurrentFilter ? 'ALL' : t)}
                              className="hover:underline flex items-center gap-1"
                              title={`Filter vault by tag "${t}"`}
                            >
                              <Tag className="w-2.5 h-2.5 text-indigo-400" />
                              <span>{t}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveTagFromIdea(idea, t, e)}
                              className="text-gray-500 hover:text-rose-400 ml-0.5"
                              title={`Remove tag "${t}" from this idea`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}

                      {/* Quick Add Tag Button / Input */}
                      {inlineTagIdeaId === idea.id ? (
                        <div className="inline-flex items-center gap-1 bg-gray-900 border border-indigo-500 rounded-md px-1.5 py-0.5 text-xs">
                          <input
                            type="text"
                            autoFocus
                            value={inlineTagValue}
                            onChange={(e) => setInlineTagValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInlineTag(idea, inlineTagValue);
                              } else if (e.key === 'Escape') {
                                setInlineTagIdeaId(null);
                              }
                            }}
                            placeholder="Tag name (e.g. Fintech)..."
                            className="bg-transparent border-none text-white text-[11px] focus:outline-none w-28"
                          />
                          <button
                            onClick={() => handleAddInlineTag(idea, inlineTagValue)}
                            className="text-indigo-400 hover:text-indigo-300 p-0.5"
                            title="Save Tag"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setInlineTagIdeaId(null)}
                            className="text-gray-500 hover:text-gray-300 p-0.5"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`idea-add-tag-btn-${idea.id}`}
                          onClick={() => {
                            setInlineTagIdeaId(idea.id);
                            setInlineTagValue('');
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900/60 hover:bg-gray-700 text-gray-400 hover:text-indigo-300 border border-dashed border-gray-700 hover:border-indigo-500/50 flex items-center gap-1 transition-colors"
                          title="Add a category tag (e.g. SaaS, Fintech, Mobile App)"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Tag</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Date & Analyze Action */}
                <div className="pt-4 border-t border-gray-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(idea.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <button
                    id={`idea-analyze-btn-${idea.id}`}
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

      {/* Add / Edit Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button
              id="ideas-modal-close-btn"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              {editingIdeaId ? 'Edit Business Idea' : 'Add Idea to Vault'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Categorize with relevant tags (e.g. SaaS, Mobile App, Fintech) and save to your vault.
            </p>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Idea Title *
                </label>
                <input
                  id="idea-form-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Financial Forecasting for Freelance Designers"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Industry / Vertical
                  </label>
                  <input
                    id="idea-form-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, SaaS, Healthcare"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Current Status
                  </label>
                  <select
                    id="idea-form-status"
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
                  Description & Value Hypothesis *
                </label>
                <textarea
                  id="idea-form-description"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem does it solve? Who is the core customer? What is the monetization model?"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Tagging System Section in Modal */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Categorization Tags (e.g. SaaS, Mobile App, Fintech)
                </label>

                {/* Active Tags Display */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-2 bg-gray-900/80 border border-gray-700 rounded-xl">
                  {activeTags.length === 0 ? (
                    <span className="text-xs text-gray-500 italic">No tags selected. Click recommendations below or type custom tag.</span>
                  ) : (
                    activeTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/40"
                      >
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromModal(t)}
                          className="text-indigo-300 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Tag Input */}
                <div className="flex items-center gap-2">
                  <input
                    id="idea-form-custom-tag-input"
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToModal(customTagInput);
                      }
                    }}
                    placeholder="Type custom tag & press enter (e.g. CleanTech, B2B)..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTagToModal(customTagInput)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-semibold transition-colors shrink-0"
                  >
                    Add Tag
                  </button>
                </div>

                {/* 1-Click Preset Tag Suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] text-gray-400 font-medium block mb-1.5">
                    Quick Add Category Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CATEGORIES.map((preset) => {
                      const isAdded = activeTags.some(t => t.toLowerCase() === preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              handleRemoveTagFromModal(preset);
                            } else {
                              handleAddTagToModal(preset);
                            }
                          }}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                            isAdded
                              ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                              : 'bg-gray-900/90 text-gray-400 hover:text-gray-200 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  id="idea-form-cancel-btn"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="idea-form-submit-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  {editingIdeaId ? 'Save Changes' : 'Save to Vault'}
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
