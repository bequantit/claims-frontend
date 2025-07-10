import React from 'react';
import { MessageSquare } from 'lucide-react';
import styles from '../../styles/CommentableViewer.module.css';

interface FloatingCommentButtonProps {
  position: { x: number; y: number };
  onClick: () => void;
}

const FloatingCommentButton: React.FC<FloatingCommentButtonProps> = ({
  position,
  onClick
}) => {
  return (
    <div 
      className={styles.floatingCommentButton}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-blue-400"
      >
        <MessageSquare size={16} />
        <span className="text-sm font-medium">Comment</span>
      </button>
    </div>
  );
};

export default FloatingCommentButton;
