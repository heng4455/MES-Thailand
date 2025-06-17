import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ isVisible, message, type = 'info', onClose, duration = 3000 }) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const styles = getToastStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 right-4 z-50 max-w-sm w-full ${styles.bg} border rounded-lg shadow-lg`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {styles.icon}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className={`text-sm font-medium ${styles.text}`}>
                  {message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={onClose}
                  className={`rounded-md inline-flex ${styles.text} hover:opacity-75 focus:outline-none`}
                >
                  <span className="sr-only">Close</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast; 