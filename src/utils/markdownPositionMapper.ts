import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Node, Position } from 'unist';
import type { Root } from 'mdast';

export interface PositionMapping {
  [elementId: string]: {
    start: number;
    end: number;
    type: string;
    content?: string;
  };
}

export interface MarkdownParseResult {
  html: string;
  positionMap: PositionMapping;
}

interface NodeWithData extends Node {
  position?: Position;
  type: string;
  value?: string;
  children?: NodeWithData[];
  tagName?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, any>;
    elementId?: string;
  };
}

let idCounter = 0;

const generateElementId = (type: string): string => {
  return `md-${type}-${++idCounter}`;
};

export const parseMarkdownWithPositions = async (markdown: string): Promise<MarkdownParseResult> => {
  const positionMap: PositionMapping = {};
  
  // Reset counter for consistent IDs
  idCounter = 0;

  // Plugin to add IDs and collect positions
  const addIdsAndPositions = () => {
    return (tree: Root) => {
      visit(tree, (node: NodeWithData) => {
        if (node.position && shouldAddId(node)) {
          const elementId = generateElementId(node.type);
          
          const start = node.position.start.offset ?? 0;
          const end = node.position.end.offset ?? 0;
          
          positionMap[elementId] = {
            start,
            end,
            type: node.type,
            content: getNodeContent(node, markdown, start, end),
          };

          // Add data for rehype conversion
          if (!node.data) {
            node.data = {};
          }
          if (!node.data.hProperties) {
            node.data.hProperties = {};
          }
          node.data.hProperties.id = elementId;
        }
      });
    };
  };

  const processor = unified()
    .use(remarkParse)
    .use(addIdsAndPositions)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(markdown);
  let html = String(result);

  // Post-process HTML to add spans around text nodes
  html = addTextSpansToHtml(html, markdown, positionMap);
  
  return {
    html,
    positionMap,
  };
};

// Post-process HTML to add spans around text nodes
const addTextSpansToHtml = (html: string, markdown: string, positionMap: PositionMapping): string => {
  try {
    // Create a DOM parser to work with the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all elements with md- IDs
    const mdElements = doc.querySelectorAll('[id^="md-"]');
    
    mdElements.forEach(element => {
      // Process text nodes within this element
      wrapTextNodesInElement(element, markdown, positionMap);
    });
    
    // Return the modified HTML
    return doc.body.innerHTML;
  } catch (error) {
    console.warn('Failed to add text spans:', error);
    return html; // Return original HTML if processing fails
  }
};

// Wrap text nodes in an element with spans
const wrapTextNodesInElement = (element: Element, markdown: string, positionMap: PositionMapping) => {
  const elementId = element.getAttribute('id');
  if (!elementId || !positionMap[elementId]) return;
  
  const elementMapping = positionMap[elementId];
  
  // Get direct text nodes (not inside child md- elements)
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Only accept text nodes that are not inside child md- elements
        let parent = node.parentElement;
        while (parent && parent !== element) {
          if (parent.id && parent.id.startsWith('md-')) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return node.textContent && node.textContent.trim() ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node as Text);
  }
  
  // Wrap each text node in a span
  textNodes.forEach(textNode => {
    if (textNode.textContent && textNode.textContent.trim()) {
      const spanId = generateElementId('textSpan');
      
      // Calculate approximate position based on element position
      const textContent = textNode.textContent;
      const elementContent = elementMapping.content || '';
      const textIndex = elementContent.indexOf(textContent.trim());
      
      if (textIndex !== -1) {
        const textStart = elementMapping.start + textIndex;
        const textEnd = textStart + textContent.trim().length;
        
        // Add to position map
        positionMap[spanId] = {
          start: textStart,
          end: textEnd,
          type: 'textSpan',
          content: textContent.trim(),
        };
        
        // Create span element
        const span = document.createElement('span');
        span.id = spanId;
        span.textContent = textContent;
        
        // Replace text node with span
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(span, textNode);
        }
      }
    }
  });
};





const shouldAddId = (node: NodeWithData): boolean => {
  // Add IDs to these markdown elements
  const typesToTrack = [
    'heading',
    'paragraph', 
    'blockquote',
    'list',
    'listItem',
    'code',
    'emphasis',
    'strong',
    'link',
    'image',
    'table',
    'tableRow',
    'tableCell',
    'thematicBreak',
    'inlineCode',
    'textSpan' // Include our new text span type
  ];
  
  return typesToTrack.includes(node.type);
};

const getNodeContent = (node: NodeWithData, markdown: string, start: number, end: number): string => {
  if (start >= 0 && end > start && end <= markdown.length) {
    return markdown.slice(start, end);
  }
  return '';
};

// Helper function to get position info for a specific element ID
export const getElementPosition = (
  elementId: string, 
  positionMap: PositionMapping
): { start: number; end: number } | null => {
  const mapping = positionMap[elementId];
  return mapping ? { start: mapping.start, end: mapping.end } : null;
};

// Helper function to find element ID by position
export const findElementByPosition = (
  position: number,
  positionMap: PositionMapping
): string | null => {
  for (const [elementId, mapping] of Object.entries(positionMap)) {
    if (position >= mapping.start && position <= mapping.end) {
      return elementId;
    }
  }
  return null;
}; 