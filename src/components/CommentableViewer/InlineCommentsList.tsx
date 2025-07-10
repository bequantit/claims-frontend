import React from 'react';
import { useCommentContext } from '../../contexts/CommentContext';
import { getCommentPosition } from '../../utils/commentUtils';
import InlineComment from './InlineComment';
import styles from '../../styles/CommentableViewer.module.css';

const InlineCommentsList: React.FC = () => {
  const { comments, hoveredComment, onCommentHover, onDeleteComment } = useCommentContext();
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
