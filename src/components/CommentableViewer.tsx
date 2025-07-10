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




  return (
    <div className={`${styles.container} ${className}`}>
      {/* Document Content */}
      <div className={styles.documentWrapper}>
        <div className={styles.documentContent}>
          <div className={styles.documentInner}>
          <DocumentHeader />

          <DocumentContent 
            isLoading={isLoading}
            htmlContent={htmlContent}
            onMouseUp={handleTextSelection}
          />
          
          <InlineCommentsList
            comments={comments}
            hoveredComment={hoveredComment}
            onCommentHover={(commentId) => handleCommentHover(commentId, comments)}
            onDeleteComment={deleteComment}
          />
          
          {selectedText && (
            <FloatingCommentButton
              position={selectionPosition}
              onClick={openModal}
            />
          )}

          {/* Modern Comment Dialog */}
          <AddCommentModal
            isOpen={showCommentDialog}
            onClose={closeModal}
            selectedText={selectedText}
            comment={newComment}
            onCommentChange={setNewComment}
            onSubmit={addComment}
          />
        </div>
        </div>

        <CommentSidebar
          comments={comments}
          hoveredComment={hoveredComment}
          onCommentHover={(commentId) => handleCommentHover(commentId, comments)}
        />
      </div>

      <SendToAIButton
        onSendToAI={() => sendToAI(comments)}
        sendingToAI={sendingToAI}
        hasComments={comments.length > 0}
      />

      {/* Export Preview Dialog */}
      {/* This section is removed as showExportPreview state is removed */}


    </div>
  );
};

export default CommentableViewer;