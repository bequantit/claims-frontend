import { useState, useEffect } from 'react';
import { Comment } from '../types/comment';
import { generateId } from '../utils/commentUtils';

interface UseCommentsProps {
  clearComments?: boolean;
  onCommentsClear?: () => void;
  resetObservationCount?: boolean;
  onObservationCountReset?: () => void;
}

export const useComments = ({
  clearComments = false,
  onCommentsClear,
  resetObservationCount = false,
  onObservationCountReset
}: UseCommentsProps = {}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [observationCount, setObservationCount] = useState(0);

  // Clear all comments function
  const clearAllComments = () => {
    setComments([]);
    console.log('All comments cleared');
  };

  // Effect to handle clearing comments when prop changes
  useEffect(() => {
    if (clearComments) {
      clearAllComments();
      onCommentsClear?.();
    }
  }, [clearComments, onCommentsClear]);

  // Effect to reset observation count when prop changes
  useEffect(() => {
    if (resetObservationCount) {
      setObservationCount(0);
      console.log('Observation count reset to 0');
      onObservationCountReset?.();
    }
  }, [resetObservationCount, onObservationCountReset]);

  const addComment = (commentData: Omit<Comment, 'id' | 'timestamp' | 'author'>) => {
    const commentId = generateId();
    const comment: Comment = {
      ...commentData,
      id: commentId,
      timestamp: new Date(),
      author: 'Current User',
    };

    setComments(prev => [...prev, comment]);
    return commentId;
  };

  const deleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const incrementObservationCount = () => {
    setObservationCount(prev => prev + 1);
  };

  return {
    comments,
    observationCount,
    addComment,
    deleteComment,
    clearAllComments,
    incrementObservationCount
  };
}; 