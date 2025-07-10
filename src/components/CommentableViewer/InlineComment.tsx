import React from 'react';
import { User, X, Clock } from 'lucide-react';
import { Comment } from '../../types/comment';
import { formatTimestamp } from '../../utils/commentUtils';

interface InlineCommentProps {
  comment: Comment;
  position: { top: number };
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete: (commentId: string) => void;
}

const InlineComment: React.FC<InlineCommentProps> = ({
  comment,
  position,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDelete
}) => {
  return (
    <div
      className={`absolute pointer-events-auto transition-all duration-300 ${
        isHovered ? 'scale-105 z-10' : ''
      }`}
      style={{ top: `${position.top}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 max-w-xs">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-900">{comment.author}</span>
          </div>
          <button
            onClick={() => onDelete(comment.id)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <X size={12} />
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-2 mb-2">
          <p className="text-xs text-amber-900 leading-relaxed">"{comment.text}"</p>
        </div>
        
        <p className="text-xs text-gray-800 leading-relaxed mb-2">{comment.comment}</p>
        
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-gray-400" />
          <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default InlineComment;
