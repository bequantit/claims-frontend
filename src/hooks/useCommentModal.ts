import { useState } from 'react';

export const useCommentModal = () => {
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');

  const openModal = () => {
    setShowCommentDialog(true);
  };

  const closeModal = () => {
    setShowCommentDialog(false);
    setNewComment(''); // Clear comment when closing
  };

  const resetComment = () => {
    setNewComment('');
  };

  return {
    showCommentDialog,
    newComment,
    setNewComment,
    openModal,
    closeModal,
    resetComment
  };
}; 