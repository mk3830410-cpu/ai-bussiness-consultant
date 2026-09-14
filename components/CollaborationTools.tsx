
import React, { useState } from 'react';
import { MessageSquare, Users, Send, X, Plus } from 'lucide-react';
import { Comment, TeamMember } from '../types';

interface CommentsProps {
  sectionId: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentSection: React.FC<CommentsProps> = ({ comments, onAddComment, isOpen, onClose }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddComment(text);
      setText('');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
        <h3 className="font-bold text-white flex items-center gap-2">
          <MessageSquare size={18} /> Comments
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center italic mt-10">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-indigo-400 text-xs">{comment.author}</span>
                <span className="text-gray-500 text-[10px]">{comment.timestamp.toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-gray-200">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-gray-800 border border-gray-600 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" disabled={!text.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

interface TeamModalProps {
  members: TeamMember[];
  onInvite: (email: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ members, onInvite, isOpen, onClose }) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onInvite(email);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-indigo-500" /> Team Collaboration
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">Invite team members to view and edit your strategy.</p>
          
          <form onSubmit={handleInvite} className="flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium text-sm transition-colors">
              <Plus size={16} /> Invite
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Members</h4>
            {members.length === 0 ? (
              <p className="text-gray-500 text-sm italic">You haven't invited anyone yet.</p>
            ) : (
              members.filter(Boolean).map(member => (
                <div key={member.id} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {(member.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{member.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{member.role} • {member.status || 'pending'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
