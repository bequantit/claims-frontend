import { useState, useEffect } from 'react';
import { parseMarkdownWithPositions, PositionMapping } from '../utils/markdownPositionMapper';

interface UseMarkdownParserProps {
  content: string;
  onPositionMapReady?: (positionMap: PositionMapping, html: string) => void;
}

export const useMarkdownParser = ({ content, onPositionMapReady }: UseMarkdownParserProps) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [positionMap, setPositionMap] = useState<PositionMapping>({});
  const [isLoading, setIsLoading] = useState(true);

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
  }, [content, onPositionMapReady]);

  return {
    htmlContent,
    positionMap,
    isLoading
  };
}; 