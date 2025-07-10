import { Comment } from '../types/comment';

/**
 * Generates a unique ID for comments
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Formats a timestamp for display in comments
 */
export const formatTimestamp = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
};

/**
 * Calculates the position of a comment based on its selected elements
 */
export const getCommentPosition = (comment: Comment): { top: number } => {
  if (!comment.selectedElements || comment.selectedElements.length === 0) {
    return { top: 0 };
  }

  try {
    // Get the first selected element to determine vertical position
    const firstElementId = comment.selectedElements[0];
    const firstElement = document.getElementById(firstElementId);
    
    if (!firstElement) {
      return { top: 0 };
    }

    // Get the element's position relative to the document container
    // Use data attribute for stable selection across CSS module changes
    const documentContainer = document.querySelector('[data-document-container="true"]');
    if (!documentContainer) {
      return { top: 0 };
    }

    const elementRect = firstElement.getBoundingClientRect();
    const containerRect = documentContainer.getBoundingClientRect();
    
    // Calculate the relative position within the document
    const relativeTop = elementRect.top - containerRect.top;
    
    return { top: Math.max(0, relativeTop) };
  } catch (error) {
    console.warn('Error calculating comment position:', error);
    return { top: 0 };
  }
};

/**
 * Generates export data structure for AI processing
 */
export const generateExportData = (
  summary: string,
  content: string,
  comments: Comment[]
) => {
  return {
    claim_summary: summary,
    observation: {
      document: {
        content: content,
        title: "Document Review",
        timestamp: new Date().toISOString(),
      },
      comments: comments.map(comment => ({
        id: comment.id,
        selectedText: comment.text,
        comment: comment.comment,
        author: comment.author,
        timestamp: comment.timestamp.toISOString(),
        position: {
          start: comment.from,
          end: comment.to,
        },
      })),
      summary: {
        totalComments: comments.length,
        authors: [...new Set(comments.map(c => c.author))],
        createdAt: new Date().toISOString(),
      }
    }
  };
};

/**
 * Validates if a text selection is valid for commenting
 */
export const isValidSelection = (selection: Selection | null): boolean => {
  return !!(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
};

/**
 * Calculates selection position for floating button placement
 */
export const getSelectionPosition = (range: Range): { x: number; y: number } => {
  const rect = range.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top - 60
  };
};

/**
 * Gets unique authors from a list of comments
 */
export const getUniqueAuthors = (comments: Comment[]): string[] => {
  return [...new Set(comments.map(c => c.author).filter((author): author is string => typeof author === 'string'))];
};

/**
 * Sorts comments by their position in the document
 */
export const sortCommentsByPosition = (comments: Comment[]): Comment[] => {
  return [...comments].sort((a, b) => a.from - b.from);
};

/**
 * Finds comments that overlap with a given text range
 */
export const findOverlappingComments = (
  comments: Comment[],
  start: number,
  end: number
): Comment[] => {
  return comments.filter(comment => 
    (comment.from <= end && comment.to >= start)
  );
}; 