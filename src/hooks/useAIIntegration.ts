import { useState } from 'react';
import { Comment } from '../types/comment';
import { generateExportData } from '../utils/commentUtils';
import { setupSessionId } from '../utils/setupSession';

const sessionId = setupSessionId();

interface UseAIIntegrationProps {
  summary: string;
  content: string;
  observationCount: number;
  onContentUpdate?: (newContent: string) => void;
  onClearComments: () => void;
  onIncrementObservationCount: () => void;
}

export const useAIIntegration = ({
  summary,
  content,
  observationCount,
  onContentUpdate,
  onClearComments,
  onIncrementObservationCount
}: UseAIIntegrationProps) => {
  const [sendingToAI, setSendingToAI] = useState(false);

  // Send to AI function
  const sendToAI = async (comments: Comment[]) => {
    setSendingToAI(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = import.meta.env.VITE_API_TOKEN;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'conversation-id': sessionId,
          'observation-number': String(observationCount),
          'token': token,
        },
        body: JSON.stringify(generateExportData(summary, content, comments), null, 2),
      });
    
      const data = await response.json();
      console.log('AI response:', data);
      console.log("Session ID:", sessionId);
      console.log("API URL:", apiUrl);

      // Handle the AI response
      if (data.analysis && data.conclusion) {
        // Combine analysis and conclusion
        const newContent = data.analysis + '\n\n' + data.conclusion;
        
        // Clear all existing comments
        onClearComments();
        
        // Update the content (this will trigger recalculation of positions)
        onContentUpdate?.(newContent);
        
        // Increment observation count
        onIncrementObservationCount();
        
        console.log('Content updated with AI response');
      }
    } catch (error) {
      console.error('Failed to send to AI:', error);
    } finally {
      setSendingToAI(false);
    }
  };

  return {
    sendingToAI,
    sendToAI
  };
}; 