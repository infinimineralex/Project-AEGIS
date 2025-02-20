import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSettings } from 'react-icons/fi';

interface Props {
  setPassword: (password: string) => void;
}

const PasswordGenerator: React.FC<Props> = ({ setPassword }) => {
  const [length, setLength] = useState<number>(12);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Ref for the settings button
  const settingsRef = useRef<HTMLButtonElement>(null);

  // Update dropdown position when toggling options or scrolling (TODO: make the scrolling snappier)
  useEffect(() => {
    const updatePosition = () => {
      if (settingsRef.current) {
        const rect = settingsRef.current.getBoundingClientRect();
        // Using fixed positioning so top/left are relative to viewport
        setDropdownPos({ top: rect.bottom, left: rect.left });
      }
    };

    if (showOptions) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showOptions]);

  const generatePassword = () => {
    let characters = '';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (includeUppercase) characters += uppercase;
    if (includeLowercase) characters += lowercase;
    if (includeNumbers) characters += numbers;
    if (includeSymbols) characters += symbols;
    
    if (!characters) {
      alert('Please select at least one character type.');
      return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setPassword(password);
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <motion.button
          type="button"
          onClick={generatePassword}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiRefreshCw size={20} />
        </motion.button>
        <motion.button
          type="button"
          ref={settingsRef}
          onClick={() => setShowOptions((prev) => !prev)}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiSettings size={20} />
        </motion.button>
      </div>
      {showOptions &&
        ReactDOM.createPortal(
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
            }}
            className="p-4 w-64 bg-white/20 backdrop-blur-md rounded shadow-lg border border-gray-500"
          >
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-300">
                Length: {length}
              </label>
              <input
                type="range"
                min="6"
                max="32"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="inline-flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Uppercase</span>
              </label>
              <label className="inline-flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Lowercase</span>
              </label>
              <label className="inline-flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Numbers</span>
              </label>
              <label className="inline-flex items-center text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Symbols</span>
              </label>
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
};

export default PasswordGenerator;