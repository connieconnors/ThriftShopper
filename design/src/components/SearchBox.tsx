import { useState, useEffect } from 'react';
import { X, Mic, Search } from 'lucide-react';

interface SearchBoxProps {
  initialTerms: string[];
  isVoiceMode: boolean;
  onClose: () => void;
  onSearch: (terms: string[]) => void;
}

export function SearchBox({ initialTerms, isVoiceMode, onClose, onSearch }: SearchBoxProps) {
  const [searchTerms, setSearchTerms] = useState<string[]>(initialTerms);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Simulate voice recognition (in real app, use Web Speech API)
  const startListening = () => {
    setIsListening(true);
    
    // Simulated voice input after 2 seconds
    setTimeout(() => {
      const mockTranscript = "whimsical gift for mom that has a vintage vibe";
      setTranscript(mockTranscript);
      
      // Parse transcript into terms
      const terms = mockTranscript.toLowerCase().split(' ').filter(word => 
        !['for', 'that', 'has', 'a', 'the', 'and'].includes(word)
      );
      setSearchTerms(terms);
      setIsListening(false);
    }, 2000);
  };

  useEffect(() => {
    if (isVoiceMode) {
      startListening();
    }
  }, [isVoiceMode]);

  const addTerm = () => {
    if (inputValue.trim()) {
      setSearchTerms([...searchTerms, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTerm = (term: string) => {
    setSearchTerms(searchTerms.filter(t => t !== term));
  };

  const handleSearch = () => {
    onSearch(searchTerms);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg">Search ThriftShopper</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Listening Indicator */}
        {isListening && (
          <div className="p-6 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              {/* Colorful spinning wheel */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 animate-spin" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="60 200"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#000080" />
                      <stop offset="25%" stopColor="#0047AB" />
                      <stop offset="50%" stopColor="#4169E1" />
                      <stop offset="75%" stopColor="#0047AB" />
                      <stop offset="100%" stopColor="#000080" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center mic icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mic className="w-6 h-6" style={{ color: '#000080' }} />
                </div>
              </div>
              <span style={{ color: '#000080' }}>Listening...</span>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="px-6 pt-4">
            <p className="text-sm text-gray-600">You said:</p>
            <p className="text-lg italic text-gray-800 mt-1">&quot;{transcript}&quot;</p>
          </div>
        )}

        {/* Search Terms */}
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {searchTerms.map((term, index) => (
              <div 
                key={`${term}-${index}`}
                className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-full flex items-center gap-2"
              >
                <span>{term}</span>
                <button
                  onClick={() => removeTerm(term)}
                  className="hover:bg-indigo-200 rounded-full p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Manual Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTerm()}
              placeholder="Add more search terms..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addTerm}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSearch}
              disabled={searchTerms.length === 0}
              className={`
                px-6 py-2 rounded-lg transition-colors
                ${searchTerms.length > 0
                  ? 'bg-indigo-900 text-white hover:bg-indigo-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Search ({searchTerms.length} {searchTerms.length === 1 ? 'term' : 'terms'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}