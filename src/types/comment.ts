export interface Comment {
  id: string;
  from: number;
  to: number;
  text: string;
  comment: string;
  timestamp: Date;
  author?: string;
  selectedElements?: string[]; // IDs of the markdown elements that were selected
}

export interface CommentSelection {
  from: number;
  to: number;
  text: string;
  selectedElements?: string[];
  originalRange?: Range;
}