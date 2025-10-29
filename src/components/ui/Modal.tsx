import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Enhanced Background overlay */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Enhanced Modal panel */}
        <div className={`inline-block align-bottom bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl text-left overflow-hidden shadow-2xl shadow-cyan-500/20 transform transition-all sm:my-8 sm:align-middle sm:w-full border border-slate-700/50 ${sizeClasses[size]}`}>
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-6 pt-6 pb-4 sm:p-8 sm:pb-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="group text-slate-400 hover:text-white focus:outline-none focus:text-white transition-all duration-300 p-2 rounded-xl hover:bg-slate-700/50"
              >
                <svg className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Enhanced Content */}
            <div className="mt-4 px-6 pb-8 sm:px-8 sm:pb-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}