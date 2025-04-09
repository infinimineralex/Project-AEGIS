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

  // Refs for settings button and dropdown container
  const settingsRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptions) {
        if (
          settingsRef.current?.contains(event.target as Node) ||
          dropdownRef.current?.contains(event.target as Node)
        ) {
          return;
        }
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="group/1">
          <motion.button
            type="button"
            onClick={generatePassword}
            className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none group relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiRefreshCw size={20} />
            <span className="absolute bottom-full mb-2 w-48 bg-white/20 backdrop-blur-md text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/1:opacity-100 transition-opacity duration-200 text-center">
              Generate new password with current settings
            </span>
          </motion.button>
        </div>
        <div className="group/2">
          <motion.button
            type="button"
            ref={settingsRef}
            onClick={() => setShowOptions((prev) => !prev)}
            className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none group relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSettings size={20} />
            <span className="absolute bottom-full mb-2 w-24 bg-white/20 backdrop-blur-md text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/2:opacity-100 transition-opacity duration-200 text-center">
              Generator Options
            </span>
          </motion.button>
        </div>
      </div>
      {showOptions &&
        ReactDOM.createPortal(
          <motion.div
            ref={dropdownRef}
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
            <div className="space-y-4">
              <div className="relative group">
                <label className="block text-sm text-gray-300 mb-1">
                 Generated Length: {length}
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full"
                />
                <span className="absolute bottom-full mb-2 w-48 bg-white/20 backdrop-blur-md text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                  Set password length (8-64 characters)
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <label className="flex items-center justify-between text-sm text-gray-300">
                    <span>Uppercase Allowed</span>
                    <input
                      type="checkbox"
                      checked={includeUppercase}
                      onChange={(e) => setIncludeUppercase(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                  </label>
                  {/*<span className="absolute bottom-full mb-2 w-48 bg-white/20 backdrop-blur-md text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                    Add uppercase letters (A-Z)
                  </span>*/}
                </div>

                <div className="relative group">
                  <label className="flex items-center justify-between text-sm text-gray-300">
                    <span>Lowercase Allowed</span>
                    <input
                      type="checkbox"
                      checked={includeLowercase}
                      onChange={(e) => setIncludeLowercase(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                  </label>
                  {/*<span className="absolute bottom-full mb-2 w-48 bg-black text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                    Add lowercase letters (a-z)
                  </span>*/}
                </div>

                <div className="relative group">
                  <label className="flex items-center justify-between text-sm text-gray-300">
                    <span>Numbers Allowed</span>
                    <input
                      type="checkbox"
                      checked={includeNumbers}
                      onChange={(e) => setIncludeNumbers(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                  </label>
                  {/*<span className="absolute bottom-full mb-2 w-48 bg-black text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                    Add numbers (0-9)
                  </span>*/}
                </div>

                <div className="relative group">
                  <label className="flex items-center justify-between text-sm text-gray-300">
                    <span>Symbols Allowed</span>
                    <input
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                  </label>
                  {/*<span className="absolute bottom-full mb-2 w-48 bg-black text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                    Add special characters (!@#$%^&*)
                  </span>*/}
                </div>
              </div>
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
};

export default PasswordGenerator;