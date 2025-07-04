export interface Comment {
  id: string;
  from: number;
  to: number;
  text: string;
  comment: string;
  timestamp: Date;
  author?: string;
}

export interface CommentSelection {
  from: number;
  to: number;
  text: string;
}