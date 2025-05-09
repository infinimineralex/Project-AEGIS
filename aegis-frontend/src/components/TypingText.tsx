import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  className?: string; // Allow passing className for styling the text itself
}

const TypingText: React.FC<TypingTextProps> = ({
  words,
  typingSpeed = 150,
  deletingSpeed = 100,
  delayBetweenWords = 2000, // This will be overridden by the prop in Home.tsx if different
  className,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && charIndex < currentWord.length) {
      // Continue typing
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, typingSpeed);
    } else if (!isDeleting && charIndex === currentWord.length) {
      // Finished typing, wait before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetweenWords);
    } else if (isDeleting && charIndex > 0) {
      // Deleting characters
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, deletingSpeed);
    } else if (isDeleting && charIndex === 0) {
      // Finished deleting, move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      // displayText is already empty from the previous step
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, words, wordIndex, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span 
      className={className} 
      // Apply min-height and inline-block to stabilize height
      // '1em' will be relative to the parent's font size (the h1's text-8xl)
      style={{ minHeight: '1em', display: 'inline-block', verticalAlign: 'bottom' }} 
    >
      {displayText}
      <span className="blinking-cursor">|</span>
    </span>
  );
};

export default TypingText;