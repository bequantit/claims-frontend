import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, X, Edit3, FileText, Clock, User, Send, Eye } from 'lucide-react';
import { Comment, CommentSelection } from '../types/comment';
import { parseMarkdownWithPositions, PositionMapping } from '../utils/markdownPositionMapper';

interface CommentableViewerProps {
  content: string;
  className?: string;
  onPositionMapReady?: (positionMap: PositionMapping, html: string) => void;
}

const CommentableViewer: React.FC<CommentableViewerProps> = ({ content, className = '', onPositionMapReady }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedText, setSelectedText] = useState<CommentSelection | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [positionMap, setPositionMap] = useState<PositionMapping>({});
  const [isLoading, setIsLoading] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const exportDialogRef = useRef<HTMLDivElement>(null);

  // Parse markdown with position mapping
  useEffect(() => {
    const parseContent = async () => {
      setIsLoading(true);
      try {
        const result = await parseMarkdownWithPositions(content);
        setHtmlContent(result.html);
        setPositionMap(result.positionMap);
        onPositionMapReady?.(result.positionMap, result.html);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setHtmlContent(content); // Fallback to plain text
      } finally {
        setIsLoading(false);
      }
    };

    parseContent();
  }, [content]);

  // We're no longer using TipTap editor, using direct HTML rendering instead

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle text selection for comments
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0).cloneRange(); // Clone to preserve original
      const rect = range.getBoundingClientRect();
      
      // Find which elements are selected
      const selectedElements = getSelectedElements(range);
      const positions = getPositionsFromElements(selectedElements, range);
      


      
      setSelectedText({
        from: positions.start,
        to: positions.end,
        text: selectedText,
        selectedElements: selectedElements,
        originalRange: range // Store the original range for precise highlighting
      });
      
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 60
      });
    } else {
      setSelectedText(null);
    }
  };

  // Get all elements with md- IDs that are within the selection
  const getSelectedElements = (range: Range): string[] => {
    const candidateElements: Element[] = [];
    
    // Get all elements with md- IDs in the document that intersect with the selection
    const allMdElements = document.querySelectorAll('[id^="md-"]');
    
    allMdElements.forEach((element) => {
      if (range.intersectsNode(element)) {
        candidateElements.push(element);
      }
    });
    
    // Filter to only keep the deepest elements (no parents if children are selected)
    const deepestElements = candidateElements.filter(element => {
      // Check if this element has any child md- elements that are also candidates
      const childMdElements = element.querySelectorAll('[id^="md-"]');
      for (const child of childMdElements) {
        if (candidateElements.includes(child)) {
          // This element has a child that's also selected, so exclude this parent
          return false;
        }
      }
      return true;
    });
    
    // Sort elements by their document order to ensure correct position calculation
    const sortedElements = deepestElements.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1; // a comes before b
      } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1; // a comes after b
      }
      return 0;
    });
    
    // Return the IDs of the deepest elements in document order
    return sortedElements
      .map(element => element.getAttribute('id'))
      .filter(id => id !== null) as string[];
  };



  // Get the start and end positions from selected elements with precise span positioning
  const getPositionsFromElements = (elementIds: string[], range: Range): { start: number; end: number } => {
    if (elementIds.length === 0) {
      return { start: 0, end: 0 };
    }
    
    // Get position data for all selected elements
    const positions = elementIds
      .map(id => positionMap[id])
      .filter(Boolean);
    
    if (positions.length === 0) {
      return { start: 0, end: 0 };
    }
    
    // Find the actual first element that contains the selection start
    let firstElementId: string | null = null;
    let firstElementMapping: any = null;
    
    // Check which element actually contains the range start
    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (element && element.contains(range.startContainer)) {
        firstElementId = elementId;
        firstElementMapping = positionMap[elementId];
        break;
      }
    }
    
    // Fallback: use element with minimum start position
    if (!firstElementId) {
      const minStart = Math.min(...positions.map(p => p.start));
      firstElementMapping = positions.find(p => p.start === minStart);
      firstElementId = firstElementMapping ? (elementIds.find(id => positionMap[id] === firstElementMapping) || null) : null;
    }
    
    let preciseStart = firstElementMapping ? firstElementMapping.start : Math.min(...positions.map(p => p.start));
    
    // Calculate precise start offset if we found the actual boundary element
    if (firstElementMapping && firstElementId && firstElementMapping.type === 'textSpan') {
      const firstElement = document.getElementById(firstElementId);
      if (firstElement && range.startContainer.nodeType === Node.TEXT_NODE) {
        // Calculate offset within the span
        const selectionStart = range.startOffset;
        
        // Get the text node that contains the selection start
        let textNode = range.startContainer as Text;
        let offsetInSpan = 0;
        
        // If the selection starts within this span's text node
        if (firstElement.contains(textNode)) {
          // Calculate the offset from the beginning of the span
          const walker = document.createTreeWalker(
            firstElement,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let currentNode;
          while (currentNode = walker.nextNode()) {
            if (currentNode === textNode) {
              offsetInSpan += selectionStart;
              break;
            } else {
              offsetInSpan += (currentNode.textContent || '').length;
            }
          }
          
          preciseStart = firstElementMapping.start + offsetInSpan;
        }
      }
    } else {
      // Fallback: if we couldn't find the boundary element, use min of all selected elements
      preciseStart = Math.min(...positions.map(p => p.start));
    }
    
    // Find the actual last element that contains the selection end
    let lastElementId: string | null = null;
    let lastElementMapping: any = null;
    
    // Check which element actually contains the range end
    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (element && element.contains(range.endContainer)) {
        lastElementId = elementId;
        lastElementMapping = positionMap[elementId];
        break;
      }
    }
    
    // Smart fallback: if we found an end element but it's very short (like a period),
    // and there's an element with a significantly larger end position, use that instead
    if (lastElementId && lastElementMapping) {
      const maxEnd = Math.max(...positions.map(p => p.end));
      const currentElementContent = lastElementMapping.content || '';
      
      // If the current end element is very short (≤2 characters) and there's another element
      // with a much larger end position, use that one instead
      if (currentElementContent.length <= 2 && maxEnd > lastElementMapping.end + 10) {
        const betterElementMapping = positions.find(p => p.end === maxEnd);
        const betterElementId = betterElementMapping ? elementIds.find(id => positionMap[id] === betterElementMapping) : null;
        
        if (betterElementId && betterElementMapping) {
          lastElementId = betterElementId;
          lastElementMapping = betterElementMapping;
        }
      }
    }
    
    // Fallback: use element with maximum end position
    if (!lastElementId) {
      const maxEnd = Math.max(...positions.map(p => p.end));
      lastElementMapping = positions.find(p => p.end === maxEnd);
      lastElementId = lastElementMapping ? (elementIds.find(id => positionMap[id] === lastElementMapping) || null) : null;
    }
    
    let preciseEnd = lastElementMapping ? lastElementMapping.end : Math.max(...positions.map(p => p.end));
    
    // Calculate precise end offset if we found the actual boundary element
    if (lastElementMapping && lastElementId && lastElementMapping.type === 'textSpan') {
      const lastElement = document.getElementById(lastElementId);
      if (lastElement && range.endContainer.nodeType === Node.TEXT_NODE) {
        // Calculate offset within the span
        const selectionEnd = range.endOffset;
        
        // Get the text node that contains the selection end
        let textNode = range.endContainer as Text;
        let offsetInSpan = 0;
        
        // If the selection ends within this span's text node
        if (lastElement.contains(textNode)) {
          // Calculate the offset from the beginning of the span
          const walker = document.createTreeWalker(
            lastElement,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let currentNode;
          while (currentNode = walker.nextNode()) {
            if (currentNode === textNode) {
              offsetInSpan += selectionEnd;
              break;
            } else {
              offsetInSpan += (currentNode.textContent || '').length;
            }
          }
          
          preciseEnd = lastElementMapping.start + offsetInSpan;
        }
      }
    } else {
      // Fallback: if we couldn't find the boundary element, use max of all selected elements
      preciseEnd = Math.max(...positions.map(p => p.end));
    }
    

    
    return {
      start: preciseStart,
      end: preciseEnd
    };
  };

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

  const addComment = () => {
    if (!selectedText || !newComment.trim()) return;

    const commentId = generateId();
    const comment: Comment = {
      id: commentId,
      from: selectedText.from,
      to: selectedText.to,
      text: selectedText.text,
      comment: newComment.trim(),
      timestamp: new Date(),
      author: 'Current User',
      selectedElements: selectedText.selectedElements,
    };

    // Add visual highlighting to the selected elements
    if (selectedText.selectedElements) {
      addHighlightToElements(selectedText.selectedElements, commentId, selectedText.originalRange);
    }
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
    setShowCommentDialog(false);
    setSelectedText(null);
  };

  const deleteComment = (commentId: string) => {
    // Find the comment to get its selected elements
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.selectedElements) {
      removeHighlightFromElements(comment.selectedElements);
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleCommentHover = (commentId: string | null) => {
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

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // Calculate comment position based on selected elements
  const getCommentPosition = (comment: Comment) => {
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
      const documentContainer = document.querySelector('.rendered-markdown');
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

  // Generate export data
  const generateExportData = () => {
    return {
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
          from: comment.from,
          to: comment.to,
        },
      })),
      summary: {
        totalComments: comments.length,
        authors: [...new Set(comments.map(c => c.author))],
        createdAt: new Date().toISOString(),
      }
    };
  };

  // Click outside to close dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowCommentDialog(false);
      }
      if (exportDialogRef.current && !exportDialogRef.current.contains(event.target as Node)) {
        setShowExportPreview(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative max-w-7xl mx-auto ${className}`}>
      {/* Document Content */}
      <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="flex-1 relative bg-gradient-to-br from-white to-gray-50">
          <div className="p-12 max-w-4xl relative">
          {/* Document Header */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Review</h1>
                <p className="text-sm text-gray-500">Select any text to add comments</p>
              </div>
            </div>
          </div>

          {/* Editor Content with Modern Typography */}
          <div className="prose prose-lg prose-slate max-w-none">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading document...</div>
              </div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                onMouseUp={handleTextSelection}
                className="rendered-markdown"
              />
            )}
          </div>
          
          {/* Inline Comments positioned alongside text */}
          <div className="absolute left-full ml-8 top-0 w-80 pointer-events-none">
            {comments.map((comment) => {
              const position = getCommentPosition(comment);
              return (
                <div
                  key={comment.id}
                  className={`absolute pointer-events-auto transition-all duration-300 ${
                    hoveredComment === comment.id ? 'scale-105 z-10' : ''
                  }`}
                  style={{ top: `${position.top}px` }}
                  onMouseEnter={() => handleCommentHover(comment.id)}
                  onMouseLeave={() => handleCommentHover(null)}
                >
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 max-w-xs">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{comment.author}</span>
                      </div>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-2 mb-2">
                      <p className="text-xs text-amber-900 leading-relaxed">"{comment.text}"</p>
                    </div>
                    
                    <p className="text-xs text-gray-800 leading-relaxed mb-2">{comment.comment}</p>
                    
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Floating Comment Button */}
          {selectedText && (
            <div 
              className="fixed z-20 animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                left: `${selectionPosition.x}px`,
                top: `${selectionPosition.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <button
                onClick={() => setShowCommentDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-blue-400"
              >
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Comment</span>
              </button>
            </div>
          )}

          {/* Modern Comment Dialog */}
          {showCommentDialog && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
              <div 
                ref={dialogRef} 
                className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Add Comment</h3>
                  </div>
                  <button
                    onClick={() => setShowCommentDialog(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Selected text:</p>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed mb-2">"{selectedText?.text}"</p>
                    {selectedText?.selectedElements && selectedText.selectedElements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Selected elements:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedText.selectedElements.map(elementId => (
                            <span key={elementId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {elementId} ({positionMap[elementId]?.type})
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Markdown positions: [{selectedText.from}:{selectedText.to}]
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Your comment:</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts on this text..."
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    rows={4}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Add Comment
                  </button>
                  <button
                    onClick={() => setShowCommentDialog(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Comments Summary Sidebar */}
        <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
                <p className="text-sm text-gray-500">{comments.length} total</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Select any text in the document to start a conversation and collaborate with others.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                <div className="text-sm text-gray-600 mb-4">
                  Comments appear next to the selected text. Hover over them to highlight the referenced text.
                </div>
                {comments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md cursor-pointer ${
                      hoveredComment === comment.id ? 'ring-2 ring-blue-200 shadow-lg' : ''
                    }`}
                    onMouseEnter={() => handleCommentHover(comment.id)}
                    onMouseLeave={() => handleCommentHover(null)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{comment.author}</span>
                      </div>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    
                    <p className="text-xs text-gray-800 leading-relaxed mb-2">{comment.comment}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Button */}
      {comments.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowExportPreview(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <Eye size={20} />
            <span>Preview Export Data</span>
          </button>
        </div>
      )}

      {/* Export Preview Dialog */}
      {showExportPreview && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
          <div 
            ref={exportDialogRef} 
            className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Export Preview</h3>
              </div>
              <button
                onClick={() => setShowExportPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">JSON Data for Service</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generateExportData(), null, 2));
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify(generateExportData(), null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  // Here you would typically send to your service
                  alert('Data would be sent to service (check console for details)');
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send to Service
              </button>
              <button
                onClick={() => setShowExportPreview(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .comment-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0 1px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 2px solid rgba(59, 130, 246, 0.3);
        }

        .comment-hover {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%) !important;
          border-bottom: 2px solid rgba(59, 130, 246, 0.5) !important;
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
        
        .comment-highlight:hover {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%);
          border-bottom-color: rgba(59, 130, 246, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .comment-highlight[data-comment-id$="-hover"] {
          background: linear-gradient(120deg, rgba(255, 235, 59, 0.4) 0%, rgba(255, 193, 7, 0.4) 100%) !important;
          border-bottom: 2px solid rgba(255, 193, 7, 0.8) !important;
          animation: pulse-yellow 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse-yellow {
          0%, 100% {
            background: linear-gradient(120deg, rgba(255, 235, 59, 0.4) 0%, rgba(255, 193, 7, 0.4) 100%);
          }
          50% {
            background: linear-gradient(120deg, rgba(255, 235, 59, 0.6) 0%, rgba(255, 193, 7, 0.6) 100%);
          }
        }
        
        .ProseMirror {
          outline: none;
        }
        
        .prose {
          font-size: 17px;
          line-height: 1.8;
          color: #374151;
        }
        
        .prose h1 {
          color: #111827;
          font-weight: 800;
          font-size: 2.5rem;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .prose h2 {
          color: #1f2937;
          font-weight: 700;
          font-size: 2rem;
          line-height: 1.3;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        .prose h3 {
          color: #374151;
          font-weight: 600;
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .prose p {
          color: #4b5563;
          margin-bottom: 1.5rem;
          text-align: justify;
        }
        
        .prose strong {
          color: #1f2937;
          font-weight: 600;
        }
        
        .prose ul, .prose ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        
        .prose li {
          margin: 0.75rem 0;
          color: #4b5563;
        }
        
        .prose blockquote {
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
        }
        
        .prose code {
          background: #f3f4f6;
          color: #1f2937;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.9em;
          border: 1px solid #e5e7eb;
        }
        
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation: animate-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CommentableViewer;