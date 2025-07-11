import React, { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import ClaimSummaryModal from './ClaimSummaryModal';

interface DocumentHeaderProps {
  summary?: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ summary = '' }) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  return (
    <>
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Review</h1>
            <p className="text-sm text-gray-500">Select any text to add comments</p>
          </div>
        </div>
        
        {/* Claim Summary Button */}
        <button
          onClick={() => setShowSummaryModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4" />
          Read claim summary
        </button>
      </div>

      {/* Claim Summary Modal */}
      <ClaimSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={summary}
      />
    </>
  );
};

export default DocumentHeader;
