import React, { MouseEvent } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}

const RippleButton: React.FC<Props> = ({ children, onClick, className }) => {
  const controls = useAnimation();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    await controls.start({
      scale: [1, 1.2, 1],
      opacity: [1, 0.5, 0],
      transition: { duration: 0.6 },
      position: 'absolute',
      top: y,
      left: x,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.7)',
      pointerEvents: 'none',
    });

    controls.stop();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={controls}
    >
      {children}
    </motion.button>
  );
};

export default RippleButton;