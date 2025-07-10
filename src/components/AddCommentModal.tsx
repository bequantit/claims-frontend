import React, { useRef, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useCommentContext } from '../contexts/CommentContext';

const AddCommentModal: React.FC = () => {
  const {
    showCommentDialog: isOpen,
    closeModal: onClose,
    selectedText,
    newComment: comment,
    setNewComment: onCommentChange,
    onSubmitComment: onSubmit,
  } = useCommentContext();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Click outside to close dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
      <div 
        ref={dialogRef} 
        className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Add Comment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Selected text:</p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-gray-800 font-medium leading-relaxed mb-2">"{selectedText?.text}"</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Your comment:</label>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Share your thoughts on this text..."
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 focus:bg-white"
            rows={4}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Add Comment
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCommentModal; 