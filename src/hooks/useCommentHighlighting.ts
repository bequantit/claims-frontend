import { useState } from 'react';
import { Comment } from '../types/comment';
import { PositionMapping } from '../utils/markdownPositionMapper';

export const useCommentHighlighting = (positionMap: PositionMapping) => {
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);

  // Add precise highlighting to selected elements
  const addHighlightToElements = (elementIds: string[], commentId: string, originalRange?: Range) => {
    if (!originalRange) {
      // Fallback to highlighting entire elements if no range available
      elementIds.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
          element.classList.add('comment-highlight');
          element.setAttribute('data-comment-id', commentId);
        }
      });
      return;
    }

    elementIds.forEach((elementId, index) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      const isFirstElement = index === 0;
      const isLastElement = index === elementIds.length - 1;
      const isOnlyElement = elementIds.length === 1;

      if (isOnlyElement && positionMap[elementId]?.type === 'textSpan') {
        // Handle single span selection with precision
        addPreciseHighlightToSpan(element, originalRange, commentId, true, true);
      } else if (isFirstElement && positionMap[elementId]?.type === 'textSpan') {
        // Handle first span - highlight from selection start to end of span
        addPreciseHighlightToSpan(element, originalRange, commentId, true, false);
      } else if (isLastElement && positionMap[elementId]?.type === 'textSpan') {
        // Handle last span - highlight from start of span to selection end
        addPreciseHighlightToSpan(element, originalRange, commentId, false, true);
      } else {
        // Highlight entire element for non-spans or middle elements
        element.classList.add('comment-highlight');
        element.setAttribute('data-comment-id', commentId);
      }
    });
  };

  // Add precise highlighting to a span element
  const addPreciseHighlightToSpan = (element: Element, range: Range, commentId: string, useStart: boolean, useEnd: boolean) => {
    try {
      const textNode = element.firstChild as Text;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        // Fallback to highlighting entire element
        element.classList.add('comment-highlight');
        element.setAttribute('data-comment-id', commentId);
        return;
      }

      const spanText = textNode.textContent || '';
      let startOffset = 0;
      let endOffset = spanText.length;

      // Calculate precise offsets within the span
      if (useStart && element.contains(range.startContainer)) {
        // Find offset from beginning of span to selection start
        if (range.startContainer === textNode) {
          startOffset = range.startOffset;
        } else {
          // Calculate offset through tree walker if needed
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
          );
          let currentOffset = 0;
          let node;
          while (node = walker.nextNode()) {
            if (node === range.startContainer) {
              startOffset = currentOffset + range.startOffset;
              break;
            }
            currentOffset += (node.textContent || '').length;
          }
        }
      }

      if (useEnd && element.contains(range.endContainer)) {
        // Find offset from beginning of span to selection end
        if (range.endContainer === textNode) {
          endOffset = range.endOffset;
        } else {
          // Calculate offset through tree walker if needed
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
          );
          let currentOffset = 0;
          let node;
          while (node = walker.nextNode()) {
            if (node === range.endContainer) {
              endOffset = currentOffset + range.endOffset;
              break;
            }
            currentOffset += (node.textContent || '').length;
          }
        }
      }

      // Don't highlight if offsets are invalid
      if (startOffset >= endOffset || startOffset < 0 || endOffset > spanText.length) {
        element.classList.add('comment-highlight');
        element.setAttribute('data-comment-id', commentId);
        return;
      }

      // Split the text into three parts: before, highlighted, after
      const beforeText = spanText.slice(0, startOffset);
      const highlightedText = spanText.slice(startOffset, endOffset);
      const afterText = spanText.slice(endOffset);

      // Create new DOM structure
      const fragment = document.createDocumentFragment();
      
      if (beforeText) {
        fragment.appendChild(document.createTextNode(beforeText));
      }
      
      if (highlightedText) {
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'comment-highlight';
        highlightSpan.setAttribute('data-comment-id', commentId);
        highlightSpan.textContent = highlightedText;
        fragment.appendChild(highlightSpan);
      }
      
      if (afterText) {
        fragment.appendChild(document.createTextNode(afterText));
      }

      // Replace the original text node with our fragment
      element.replaceChild(fragment, textNode);

    } catch (error) {
      console.warn('Error adding precise highlight:', error);
      // Fallback to highlighting entire element
      element.classList.add('comment-highlight');
      element.setAttribute('data-comment-id', commentId);
    }
  };

  // Remove highlighting from elements
  const removeHighlightFromElements = (elementIds: string[]) => {
    elementIds.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        // Remove highlighting from the element itself
        element.classList.remove('comment-highlight', 'comment-hover');
        element.removeAttribute('data-comment-id');
        
        // Also remove any nested highlight spans that might have been created for precise highlighting
        const highlightSpans = element.querySelectorAll('.comment-highlight');
        highlightSpans.forEach(span => {
          if (span.parentNode) {
            // Replace the span with its text content
            const textNode = document.createTextNode(span.textContent || '');
            span.parentNode.replaceChild(textNode, span);
          }
        });
        
        // Normalize the element to merge adjacent text nodes
        element.normalize();
      }
    });
  };

  // Add hover effect to elements (only to precise highlights if they exist)
  const addHoverToElements = (elementIds: string[]) => {
    elementIds.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        // Check if this element has nested highlight spans (precise highlighting)
        const highlightSpans = element.querySelectorAll('.comment-highlight');
        
        if (highlightSpans.length > 0) {
          // Only add hover to the precise highlight spans
          highlightSpans.forEach(span => {
            span.classList.add('comment-hover');
          });
        } else {
          // Fallback: add hover to entire element if no precise highlights exist
          element.classList.add('comment-hover');
        }
      }
    });
  };

  // Remove hover effect from elements
  const removeHoverFromElements = (elementIds: string[]) => {
    elementIds.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        // Remove hover from both the element and any nested highlight spans
        element.classList.remove('comment-hover');
        const highlightSpans = element.querySelectorAll('.comment-highlight');
        highlightSpans.forEach(span => {
          span.classList.remove('comment-hover');
        });
      }
    });
  };

  const handleCommentHover = (commentId: string | null, comments: Comment[]) => {
    // Remove hover effects from all elements
    comments.forEach(comment => {
      if (comment.selectedElements) {
        removeHoverFromElements(comment.selectedElements);
      }
    });

    setHoveredComment(commentId);
    
    // Add hover effect to the hovered comment's elements
    if (commentId) {
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.selectedElements) {
        addHoverToElements(comment.selectedElements);
      }
    }
  };

  return {
    hoveredComment,
    addHighlightToElements,
    removeHighlightFromElements,
    handleCommentHover
  };
}; 