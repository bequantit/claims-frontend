import React, { createContext, useContext, ReactNode } from 'react';
import { Comment } from '../types/comment';

interface CommentContextType {
  // Comment data
  comments: Comment[];
  hoveredComment: string | null;
  
  // Comment actions
  onCommentHover: (commentId: string | null) => void;
  onDeleteComment: (commentId: string) => void;
  
  // Selection state
  selectedText: any; // You might want to type this properly based on your selection type
  
  // Modal state
  showCommentDialog: boolean;
  newComment: string;
  setNewComment: (comment: string) => void;
  openModal: () => void;
  closeModal: () => void;
  onSubmitComment: () => void;
  
  // Position data
  selectionPosition: { x: number; y: number };
  
  // Loading states
  isLoading: boolean;
  sendingToAI: boolean;
  
  // AI actions
  onSendToAI: () => void;
  hasComments: boolean;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

interface CommentProviderProps {
  children: ReactNode;
  value: CommentContextType;
}

export const CommentProvider: React.FC<CommentProviderProps> = ({ children, value }) => {
  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

export const useCommentContext = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useCommentContext must be used within a CommentProvider');
  }
  return context;
}; 