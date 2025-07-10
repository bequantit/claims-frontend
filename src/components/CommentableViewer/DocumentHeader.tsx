import React from 'react';
import { FileText } from 'lucide-react';

const DocumentHeader: React.FC = () => {
  return (
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
    </div>
  );
};

export default DocumentHeader;
