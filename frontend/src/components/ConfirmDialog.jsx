import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '삭제 확인',
  message = '정말로 삭제하시겠습니까?',
  confirmText = '삭제',
  cancelText = '취소',
  type = 'danger' // danger, warning, info
}) => {
  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      iconBg: 'bg-red-100'
    },
    warning: {
      icon: 'text-yellow-600',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      iconBg: 'bg-yellow-100'
    },
    info: {
      icon: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconBg: 'bg-blue-100'
    }
  };

  const currentStyle = typeStyles[type];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <AlertTriangle className={`h-6 w-6 ${currentStyle.icon}`} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className={`relative w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer ${currentStyle.confirmButton}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConfirm();
                }}
              >
                {confirmText}
              </button>
              <button
                type="button"
                className="relative mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog; 