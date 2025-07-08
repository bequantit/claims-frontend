export interface Comment {
  id: string;
  from: number;
  to: number;
  text: string;
  comment: string;
  timestamp: Date;
  author?: string;
  markdownFrom?: number;
  markdownTo?: number;
  markdownText?: string;
}

export interface CommentSelection {
  from: number;
  to: number;
  text: string;
}

export interface PositionMapping {
  renderedStart: number;
  renderedEnd: number;
  markdownStart: number;
  markdownEnd: number;
  text: string;
}

export interface MarkdownPosition {
  offset: number;
  line: number;
  column: number;
}