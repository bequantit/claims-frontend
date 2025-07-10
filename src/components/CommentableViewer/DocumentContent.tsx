import React from 'react';
import { useCommentContext } from '../../contexts/CommentContext';
import styles from '../../styles/CommentableViewer.module.css';

interface DocumentContentProps {
  htmlContent: string;
  onMouseUp: () => void;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  htmlContent,
  onMouseUp
}) => {
  const { isLoading } = useCommentContext();
  return (
    <div className="prose prose-lg prose-slate max-w-none">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading document...</div>
        </div>
      ) : (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          onMouseUp={onMouseUp}
          className={styles.renderedMarkdown}
          data-document-container="true"
        />
      )}
    </div>
  );
};

export default DocumentContent;
