import React from 'react';
import { User, Clock } from 'lucide-react';
import { Comment } from '../../types/comment';
import { formatTimestamp } from '../../utils/commentUtils';

interface SidebarCommentItemProps {
  comment: Comment;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SidebarCommentItem: React.FC<SidebarCommentItemProps> = ({
  comment,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md cursor-pointer ${
        isHovered ? 'ring-2 ring-blue-200 shadow-lg' : ''
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-900">{comment.author}</span>
        </div>
        <span className="text-xs text-gray-500">#{index + 1}</span>
      </div>
      
      <p className="text-xs text-gray-800 leading-relaxed mb-2">{comment.comment}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-gray-400" />
          <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarCommentItem;
