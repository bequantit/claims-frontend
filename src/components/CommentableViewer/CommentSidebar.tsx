import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Comment } from '../../types/comment';
import SidebarCommentItem from './SidebarCommentItem';

interface CommentSidebarProps {
  comments: Comment[];
  hoveredComment: string | null;
  onCommentHover: (commentId: string | null) => void;
}

const CommentSidebar: React.FC<CommentSidebarProps> = ({
  comments,
  hoveredComment,
  onCommentHover
}) => {
  return (
    <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
            <p className="text-sm text-gray-500">{comments.length} total</p>
          </div>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Select any text in the document to start a conversation and collaborate with others.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            <div className="text-sm text-gray-600 mb-4">
              Comments appear next to the selected text. Hover over them to highlight the referenced text.
            </div>
            {comments.map((comment, index) => (
              <SidebarCommentItem
                key={comment.id}
                comment={comment}
                index={index}
                isHovered={hoveredComment === comment.id}
                onMouseEnter={() => onCommentHover(comment.id)}
                onMouseLeave={() => onCommentHover(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSidebar;
