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
        editor
          .chain()
          .focus()
          .setTextSelection({ from: comment.from, to: comment.to })
          .run();
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentableViewer;