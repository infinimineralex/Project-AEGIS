import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaTachometerAlt } from 'react-icons/fa';
import MouseMoveEffect from '../components/MouseMoveEffect';
import TypingText from '../components/TypingText';

const Home: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/public/background1.jpg)' }}>
      {/* Darkening overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>
      {/* Mouse move flair, only on landing page */}
      <MouseMoveEffect />


      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 min-h-screen">
        {/* Hero Section. Logo commented out for now<motion.img
            src="/white1.png"
            alt="Aegis Logo"
            className="mx-auto h-60 w-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
          /> */}
        <section className="container flex min-h-[calc(100vh-9.5rem)] max-w-screen-xl flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
      <div className="space-y-4">
        <h1 className="bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-8xl font-bold tracking-tight sm:text-8xl md:text-8xl lg:text-8xl">
          THE FUTURE OF{' '}
          <TypingText
            words={[
              "PASSWORD MANAGEMENT",
              "SECURITY",
              "PEACE-OF-MIND",
              "TRUST",
              "AUTHENTICATION"
            ]}
            typingSpeed={150}
            deletingSpeed={100}
            delayBetweenWords={1000}
          />
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
        Aegis is your trusted password manager, offering top-tier security, seamless usability, and powerful features to keep your digital life safe and organized.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-indigo-500 font-bold rounded-lg shadow-md hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border border-white text-white font-bold rounded-lg shadow-md hover:bg-white hover:text-indigo-500 transition-colors"
            >
              Login
            </Link>
          </div>
    </section>
        {/*<section className="text-center mb-16">
          
          <motion.h1
            className="text-8xl tracking-tight font-extrabold text-indigo-500 mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            THE FUTURE OF PASSWORD MANAGEMENT
          </motion.h1>
          <motion.p
            className="text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Aegis is your trusted password manager, offering top-tier security, seamless usability, and powerful features to keep your digital life safe and organized.
          </motion.p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-indigo-500 font-bold rounded-lg shadow-md hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border border-white text-white font-bold rounded-lg shadow-md hover:bg-white hover:text-indigo-500 transition-colors"
            >
              Login
            </Link>
          </div>
        </section>*/}

        {/* Features Section */}
        <section className="w-full max-w-6xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <FaShieldAlt className="mx-auto h-16 w-16 mb-4 text-white-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">End-to-End Encryption</h3>
              <p className="text-gray-300">
                Your data is encrypted on your device, instantly. Only you hold the keys to access your sensitive information.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <FaLock className="mx-auto h-16 w-16 mb-4 text-white-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">Privacy First</h3>
              <p className="text-gray-300">
                We respect your privacy. Your salted master password and data are never stored or tracked, ensuring complete confidentiality.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
            >
              <FaTachometerAlt className="mx-auto h-16 w-16 mb-4 text-white-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">Fast and Reliable</h3>
              <p className="text-gray-300">
                Experience soon-to-be lightning-fast access to your passwords and credentials across all your devices with our optimized infrastructure.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How Aegis Works Section */}
        <section className="w-full max-w-6xl mb-16">
          <motion.div
            whileHover={{ scale: 1.01 }}
          >
          <h2 className="text-4xl font-bold text-center text-white-500 mb-8">
            How Aegis Works
          </h2>
          <div className="flex flex-col md:flex-row items-center bg-white/20 backdrop-blur-md p-8 rounded-lg shadow-lg">
            <motion.div
              className="w-full md:w-1/2"
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src="/white1.png"
                alt="Process Diagram"
                className="w-full mb-8 md:mb-0"
              />
            </motion.div>
            <motion.div
              className="w-full md:w-1/2 md:pl-12"
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-lg text-gray-100 mb-4">
                Aegis uses robust encryption standards to secure your passwords. Each password is encrypted using your unique salted master key directly on your device, ensuring that only you can access your sensitive information.
              </p>
              <p className="text-lg text-gray-100">
                With planned seamless synchronization across devices, your credentials will be accessible wherever you go, without compromising security.
              </p>
            </motion.div>
          </div>
          </motion.div>
        </section>

        {/* Call to Action Section */}
        <section className="mt-16">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-red-500 p-8 rounded-lg shadow-lg text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Secure Your Passwords?</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-indigo-500 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-transparent border border-white text-white rounded-lg shadow-md hover:bg-white hover:text-indigo-500 transition-colors"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Home;