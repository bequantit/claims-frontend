import { PositionMapping } from './markdownPositionMapper';

// Get all elements with md- IDs that are within the selection
export const getSelectedElements = (range: Range): string[] => {
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
export const getPositionsFromElements = (
  elementIds: string[], 
  range: Range, 
  positionMap: PositionMapping
): { start: number; end: number } => {
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