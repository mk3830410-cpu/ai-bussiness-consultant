import React, { useState } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Trash2, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  FolderPlus,
  Calendar,
  X
} from 'lucide-react';
import { BusinessIdeaItem } from '../types';

interface BusinessIdeasVaultProps {
  ideas: BusinessIdeaItem[];
  onSaveIdea: (idea: BusinessIdeaItem) => void;
  onDeleteIdea: (id: string) => void;
  onAnalyzeIdea: (idea: BusinessIdeaItem) => void;
}

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
  const [tagInput, setTagInput] = useState('');

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
      tags: tags.length > 0 ? tags : ['Startup'],
      createdAt: Date.now(),
    };

    onSaveIdea(newIdea);
    setTitle('');
    setDescription('');
    setTagInput('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-gray-800/90 border border-gray-700/80 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200 shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {idea.industry}
                  </span>
                  <button
                    onClick={() => onDeleteIdea(idea.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Idea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{idea.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-4">
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
          ))}
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

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Industry / Category
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. MediaTech, SaaS, Healthcare"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
