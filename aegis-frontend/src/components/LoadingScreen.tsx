import React from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiShield } from 'react-icons/fi';

const overlayVariants = {
	initial: { y: 0, opacity: 1 },
	animate: { y: '100%', opacity: 0, transition: { duration: 1.0, ease: 'easeInOut' } }
};

const LoadingScreen: React.FC = () => {
	return (
		<motion.div
			variants={overlayVariants}
			initial="initial"
			animate="animate"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md"
		>
			<div className="mb-4 flex space-x-4 drop-shadow-lg">
				<FiLock size={100} className="text-white drop-shadow-lg" />
				<FiShield size={100} className="text-white drop-shadow-lg" />
			</div>
			<motion.div
				className="text-3xl font-semibold text-white drop-shadow-lg"
				animate={{ scale: [1, 1.2, 1] }}
				transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
			>
				Loading your Future...
			</motion.div>
		</motion.div>
	);
};

export default LoadingScreen;
