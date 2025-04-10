import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import api from '../utils/api';

const FeedbackPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/feedback', { rating, message });
      setFeedbackStatus('Feedback sent! Thanks!');
      // Reset state after sending
      setRating(0);
      setMessage('');
      setTimeout(() => {
        setFeedbackStatus('');
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      //setFeedbackStatus('Failed to send feedback.', err.response?.data?.message);
      setFeedbackStatus(err.response?.data?.message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <motion.div 
          className="bg-gradient-to-r from-blue-500 to-red-500 backdrop-blur-md p-4 rounded-lg shadow-lg text-white w-80"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Feedback</h3>
            <button onClick={() => setIsOpen(false)} className="text-white text-sm underline">Close</button>
          </div>
          <div className="mb-3">
            <p className="mb-1">Enjoy using AEGIS? Please rate the app:</p>
            <div className="flex space-x-1">
              {[1,2,3,4,5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer text-4xl drop-shadow-lg ${star <= rating ? 'text-yellow-400' : 'text-white'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your comments, questions, or feedback..."
              className="shadow-lg w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
            />
            <button 
              type="submit" 
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-black/30 hover:bg-black/50 focus:outline-none"
            >
              <FiSend className="mr-2" /> Send Feedback
            </button>
          </form>
          {feedbackStatus && <p className="mt-2 text-sm">{feedbackStatus}</p>}
        </motion.div>
      ) : (
        <motion.button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-red-500 backdrop-blur-md p-3 rounded shadow-lg text-white hover:bg-gradient-to-l"
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        >
          Comments, Questions, or Feedback?
        </motion.button>
      )}
    </div>
  );
};

export default FeedbackPopup;
