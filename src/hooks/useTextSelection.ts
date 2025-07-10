import { useState } from 'react';
import { CommentSelection } from '../types/comment';
import { isValidSelection, getSelectionPosition } from '../utils/commentUtils';
import { getSelectedElements, getPositionsFromElements } from '../utils/positionUtils';
import { PositionMapping } from '../utils/markdownPositionMapper';

interface UseTextSelectionProps {
  positionMap: PositionMapping;
}

export const useTextSelection = ({ positionMap }: UseTextSelectionProps) => {
  const [selectedText, setSelectedText] = useState<CommentSelection | null>(null);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (isValidSelection(selection)) {
      const selectedTextContent = selection!.toString().trim();
      const range = selection!.getRangeAt(0).cloneRange();
      
      // Find which elements are selected
      const selectedElements = getSelectedElements(range);
      const positions = getPositionsFromElements(selectedElements, range, positionMap);
      
      setSelectedText({
        from: positions.start,
        to: positions.end,
        text: selectedTextContent,
        selectedElements: selectedElements,
        originalRange: range
      });
      
      setSelectionPosition(getSelectionPosition(range));
    } else {
      setSelectedText(null);
    }
  };

  const clearSelection = () => {
    setSelectedText(null);
  };

  return {
    selectedText,
    selectionPosition,
    handleTextSelection,
    clearSelection
  };
}; 