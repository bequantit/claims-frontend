import React from 'react';
import { Send } from 'lucide-react';
import { useCommentContext } from '../../contexts/CommentContext';
import styles from '../../styles/CommentableViewer.module.css';

const SendToAIButton: React.FC = () => {
  const { onSendToAI, sendingToAI, hasComments } = useCommentContext();
  if (!hasComments) return null;

  return (
    <div className={styles.sendToAIContainer}>
      <button
        onClick={onSendToAI}
        disabled={sendingToAI}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
      >
        {sendingToAI ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <Send size={20} />
        )}
        <span>{sendingToAI ? 'Sending to AI...' : 'Send to AI'}</span>
      </button>
    </div>
  );
};

export default SendToAIButton;
