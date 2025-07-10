import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommentContext } from '../../contexts/CommentContext';
import styles from '../../styles/CommentableViewer.module.css';

const FloatingCommentButton: React.FC = () => {
  const { selectedText, selectionPosition, openModal } = useCommentContext();

  if (!selectedText) return null;
  return (
          <div 
        className={styles.floatingCommentButton}
        style={{
          left: `${selectionPosition.x}px`,
          top: `${selectionPosition.y}px`,
        }}
      >
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-blue-400"
        >
        <MessageSquare size={16} />
        <span className="text-sm font-medium">Comment</span>
      </button>
    </div>
  );
};

export default FloatingCommentButton;
