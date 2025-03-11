import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded shadow-md overflow-hidden"
    >
      <div>{message}</div>
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3, ease: 'linear' }}
        className="bg-blue-400 h-1 mt-2"
      />
    </motion.div>
  );
};

export default Notification;
