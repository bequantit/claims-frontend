import { Comment } from '../types/comment';

export interface CommentedMarkdown {
  originalMarkdown: string;
  integratedMarkdown: string;
  commentMap: Array<{
    commentId: string;
    markdownPosition: { start: number; end: number };
    text: string;
    comment: string;
    author?: string;
  }>;
}

export class MarkdownCommentIntegrator {
  static createStructuredFormat(originalMarkdown: string, comments: Comment[]): {
    document: {
      content: string;
    };
    comments: Array<{
      from: number;
      to: number;
      comment: string;
    }>;
  } {
    const validComments = comments.filter(comment => 
      comment.markdownFrom !== undefined && 
      comment.markdownTo !== undefined &&
      comment.markdownText !== undefined
    );

    const commentsList = validComments.map(comment => ({
      from: comment.markdownFrom!,
      to: comment.markdownTo!,
      comment: comment.comment
    }));

    return {
      document: {
        content: originalMarkdown
      },
      comments: commentsList
    };
  }
} 