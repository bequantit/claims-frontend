import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import CommentableViewer from './components/CommentableViewer';
import CaseSelector from './components/CaseSelector';
import { PositionMapping } from './utils/markdownPositionMapper';
import { loadFullCaseContent, getCaseNames, CaseName } from './utils/caseLoader';
import { generateNewSessionId } from './utils/setupSession';

function App() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [clearComments, setClearComments] = useState(false);
  const [resetObservationCount, setResetObservationCount] = useState(false);
  const [content, setContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Get case names dynamically from the loader
  const cases = getCaseNames();

  const handleCaseSelect = async (caseName: string) => {
    try {
      setIsLoadingContent(true);
      
      // Clear all existing comments when case changes
      setClearComments(true);
      
      // Reset observation count when case changes
      setResetObservationCount(true);
      
      // Generate new session ID for the new case
      generateNewSessionId();
      
      // Load both analysis and summary content
      const caseContent = await loadFullCaseContent(caseName as CaseName);
      setContent(caseContent.analysis);
      setSummary(caseContent.summary);
      setSelectedCase(caseName);
      
      console.log('Case selected:', caseName, 'Analysis and summary loaded');
    } catch (error) {
      console.error('Failed to load case content:', error);
      // Reset to previous state if loading fails
      setContent('');
      setSummary('');
      setSelectedCase(null);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleCommentsClear = () => {
    // Reset the clear flag after comments have been cleared
    setClearComments(false);
  };

  const handleObservationCountReset = () => {
    // Reset the observation count flag after it has been reset
    setResetObservationCount(false);
  };

  const handleContentUpdate = (newContent: string) => {
    // Update content when AI responds with new analysis + conclusion
    setContent(newContent);
    console.log('Content updated from AI response');
  };

  const handlePositionMapReady = (mapping: PositionMapping, html: string) => {
    // Position mapping ready for any future use
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-6">

        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Demo for iterative document generation
          </h1>

          <div className="mb-8">
          <CaseSelector 
            cases={cases}
            selectedCase={selectedCase}
            onCaseSelect={handleCaseSelect}
          />
        </div>
        </div>
        
        {isLoadingContent ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading case analysis...</p>
            </div>
          </div>
        ) : content ? (
        <CommentableViewer 
            content={content} 
            summary={summary}
            onPositionMapReady={handlePositionMapReady}
            clearComments={clearComments}
            onCommentsClear={handleCommentsClear}
            resetObservationCount={resetObservationCount}
            onObservationCountReset={handleObservationCountReset}
            onContentUpdate={handleContentUpdate}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Case Selected</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Please select a case from the dropdown above to load and review the analysis document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;