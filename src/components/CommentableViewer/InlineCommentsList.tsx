import React from 'react';
import { Comment } from '../../types/comment';
import { getCommentPosition } from '../../utils/commentUtils';
import InlineComment from './InlineComment';
import styles from '../../styles/CommentableViewer.module.css';

interface InlineCommentsListProps {
  comments: Comment[];
  hoveredComment: string | null;
  onCommentHover: (commentId: string | null) => void;
  onDeleteComment: (commentId: string) => void;
}

const InlineCommentsList: React.FC<InlineCommentsListProps> = ({
  comments,
  hoveredComment,
  onCommentHover,
  onDeleteComment
}) => {
  return (
    <div className={styles.inlineCommentsContainer}>
      {comments.map((comment) => {
        const position = getCommentPosition(comment);
        return (
          <InlineComment
            key={comment.id}
            comment={comment}
            position={position}
            isHovered={hoveredComment === comment.id}
            onMouseEnter={() => onCommentHover(comment.id)}
            onMouseLeave={() => onCommentHover(null)}
            onDelete={onDeleteComment}
          />
        );
      })}
    </div>
  );
};

export default InlineCommentsList;
