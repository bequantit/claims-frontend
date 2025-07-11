import React from 'react';
import { PositionMapping } from '../utils/markdownPositionMapper';
import AddCommentModal from './AddCommentModal';
import {
  DocumentHeader,
  DocumentContent,
  InlineCommentsList,
  FloatingCommentButton,
  CommentSidebar,
  SendToAIButton
} from './CommentableViewer/index';
import { useComments } from '../hooks/useComments';
import { useTextSelection } from '../hooks/useTextSelection';
import { useCommentHighlighting } from '../hooks/useCommentHighlighting';
import { useMarkdownParser } from '../hooks/useMarkdownParser';
import { useAIIntegration } from '../hooks/useAIIntegration';
import { useCommentModal } from '../hooks/useCommentModal';
import { CommentProvider } from '../contexts/CommentContext';
import '../styles/index.css';
import styles from '../styles/CommentableViewer.module.css';

interface CommentableViewerProps {
  content: string;
  summary?: string;
  className?: string;
  onPositionMapReady?: (positionMap: PositionMapping, html: string) => void;
  onContentUpdate?: (newContent: string) => void;
  clearComments?: boolean;
  onCommentsClear?: () => void;
  resetObservationCount?: boolean;
  onObservationCountReset?: () => void;
}

const CommentableViewer: React.FC<CommentableViewerProps> = ({ 
  content, 
  summary = '',
  className = '', 
  onPositionMapReady,
  onContentUpdate,
  clearComments = false,
  onCommentsClear,
  resetObservationCount,
  onObservationCountReset
}) => {
  // Initialize all hooks
  const {
    comments,
    observationCount,
    addComment: addCommentToState,
    deleteComment: deleteCommentFromState,
    clearAllComments,
    incrementObservationCount
  } = useComments({ clearComments, onCommentsClear, resetObservationCount, onObservationCountReset });

  const { htmlContent, positionMap, isLoading } = useMarkdownParser({ content, onPositionMapReady });

  const { selectedText, selectionPosition, handleTextSelection, clearSelection } = useTextSelection({ positionMap });

  const { hoveredComment, addHighlightToElements, removeHighlightFromElements, handleCommentHover } = useCommentHighlighting(positionMap);

  const { showCommentDialog, newComment, setNewComment, openModal, closeModal } = useCommentModal();

  const { sendingToAI, sendToAI } = useAIIntegration({
    summary,
    content,
    observationCount,
    onContentUpdate,
    onClearComments: clearAllComments,
    onIncrementObservationCount: incrementObservationCount
  });

  // Simplified comment handler that integrates with hooks
  const addComment = () => {
    if (!selectedText || !newComment.trim()) return;

    const commentData = {
      from: selectedText.from,
      to: selectedText.to,
      text: selectedText.text,
      comment: newComment.trim(),
      selectedElements: selectedText.selectedElements,
    };

    const commentId = addCommentToState(commentData);

    // Add visual highlighting to the selected elements
    if (selectedText.selectedElements) {
      addHighlightToElements(selectedText.selectedElements, commentId, selectedText.originalRange);
    }
    
    closeModal();
    clearSelection();
  };

  const deleteComment = (commentId: string) => {
    // Find the comment to get its selected elements
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.selectedElements) {
      removeHighlightFromElements(comment.selectedElements);
    }
    deleteCommentFromState(commentId);
  };

  // Prepare context value
  const contextValue = {
    // Comment data
    comments,
    hoveredComment,
    
    // Comment actions
    onCommentHover: (commentId: string | null) => handleCommentHover(commentId, comments),
    onDeleteComment: deleteComment,
    
    // Selection state
    selectedText,
    
    // Modal state
    showCommentDialog,
    newComment,
    setNewComment,
    openModal,
    closeModal,
    onSubmitComment: addComment,
    
    // Position data
    selectionPosition,
    
    // Loading states
    isLoading,
    sendingToAI,
    
    // AI actions
    onSendToAI: () => sendToAI(comments),
    hasComments: comments.length > 0,
  };

  return (
    <CommentProvider value={contextValue}>
      <div className={`${styles.container} ${className}`}>
        {/* Document Content */}
        <div className={styles.documentWrapper}>
          <div className={styles.documentContent}>
            <div className={styles.documentInner}>
            <DocumentHeader summary={summary} />

            <DocumentContent 
              htmlContent={htmlContent}
              onMouseUp={handleTextSelection}
            />
            
            <InlineCommentsList />
            
            <FloatingCommentButton />

            {/* Modern Comment Dialog */}
            <AddCommentModal />
          </div>
          </div>

          <CommentSidebar />
        </div>

        <SendToAIButton />

        {/* Export Preview Dialog */}
        {/* This section is removed as showExportPreview state is removed */}

      </div>
    </CommentProvider>
  );
};

export default CommentableViewer;