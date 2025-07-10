import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CaseSelectorProps {
  cases: string[];
  selectedCase: string | null;
  onCaseSelect: (caseName: string) => void;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({ cases, selectedCase, onCaseSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCaseSelect = (caseName: string) => {
    onCaseSelect(caseName);
    setIsOpen(false);
    console.log('Selected case:', caseName);
  };

  return (
    <div className="relative w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Case
      </label>
      <div className="relative">
        <button
          type="button"
          className="relative w-full bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="block truncate">
            {selectedCase || 'Choose a case...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {cases.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">No cases available</div>
            ) : (
              cases.map((caseName) => (
                <button
                  key={caseName}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-colors"
                  onClick={() => handleCaseSelect(caseName)}
                >
                  {caseName}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CaseSelector; 