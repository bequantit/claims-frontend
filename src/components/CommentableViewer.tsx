import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { MessageSquare, Plus, X, Edit3, FileText, Clock, User, Send, Eye } from 'lucide-react';
import { Comment, CommentSelection } from '../types/comment';
import MarkdownIt from 'markdown-it';

interface CommentableViewerProps {
  content: string;
  className?: string;
}

const CommentableViewer: React.FC<CommentableViewerProps> = ({ content, className = '' }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedText, setSelectedText] = useState<CommentSelection | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [showExportPreview, setShowExportPreview] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const exportDialogRef = useRef<HTMLDivElement>(null);

  // Initialize markdown parser
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  // Convert markdown to HTML
  const htmlContent = md.render(content);

  // Custom highlight extension for comments
  const CommentHighlight = Highlight.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        commentId: {
          default: null,
          parseHTML: element => element.getAttribute('data-comment-id'),
          renderHTML: attributes => {
            if (!attributes.commentId) return {};
            return {
              'data-comment-id': attributes.commentId,
              class: 'comment-highlight cursor-pointer transition-all duration-300 hover:shadow-sm',
            };
          },
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Typography,
      CommentHighlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'comment-highlight',
        },
      }),
    ],
    content: htmlContent,
    editable: false,
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      if (!empty) {
        const selectedText = editor.state.doc.textBetween(from, to);
        setSelectedText({ from, to, text: selectedText });
        
        // Get selection position for floating button
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        setSelectionPosition({
          x: (start.left + end.left) / 2,
          y: start.top - 60,
        });
      } else {
        setSelectedText(null);
      }
    },
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addComment = () => {
    if (!selectedText || !newComment.trim() || !editor) return;

    const commentId = generateId();
    const comment: Comment = {
      id: commentId,
      from: selectedText.from,
      to: selectedText.to,
      text: selectedText.text,
      comment: newComment.trim(),
      timestamp: new Date(),
      author: 'Current User',
    };

    // Add highlight to the selected text with gradient background
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selectedText.from, to: selectedText.to })
      .setHighlight({ 
        color: 'rgba(59, 130, 246, 0.15)',
        commentId: commentId,
      })
      .run();

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setShowCommentDialog(false);
    setSelectedText(null);
  };

  const deleteComment = (commentId: string) => {
    if (!editor) return;

    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: comment.from, to: comment.to })
        .unsetHighlight()
        .run();
    }

    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleCommentHover = (commentId: string | null) => {
    setHoveredComment(commentId);
    
    if (commentId && editor) {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        // Add temporary yellow highlight when hovering
        editor
          .chain()
          .focus()
          .setTextSelection({ from: comment.from, to: comment.to })
          .setHighlight({ 
            color: 'rgba(255, 235, 59, 0.4)',
            commentId: `${commentId}-hover`,
          })
          .run();
      }
    } else if (editor) {
      // Remove hover highlights when not hovering
      const doc = editor.state.doc;
      doc.descendants((node, pos) => {
        if (node.marks) {
          node.marks.forEach(mark => {
            if (mark.type.name === 'highlight' && mark.attrs.commentId?.endsWith('-hover')) {
              const from = pos;
              const to = pos + node.nodeSize;
              editor
                .chain()
                .focus()
                .setTextSelection({ from, to })
                .unsetHighlight()
                .run();
            }
          });
        }
      });
      
      // Restore original comment highlights
      comments.forEach(c => {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: c.from, to: c.to })
          .setHighlight({ 
            color: 'rgba(59, 130, 246, 0.15)',
            commentId: c.id,
          })
          .run();
      });
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

  // Calculate comment position based on text position
  const getCommentPosition = (comment: Comment) => {
    if (!editor) return { top: 0 };
    
    try {
      const { view } = editor;
      const startPos = view.coordsAtPos(comment.from);
      const editorRect = view.dom.getBoundingClientRect();
      
      return {
        top: startPos.top - editorRect.top,
      };
    } catch {
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
        }
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
            <EditorContent editor={editor} />
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
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">"{selectedText?.text}"</p>
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
                  console.log('Sending to service:', generateExportData());
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

      <style jsx>{`
        .comment-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0 1px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 2px solid rgba(59, 130, 246, 0.3);
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