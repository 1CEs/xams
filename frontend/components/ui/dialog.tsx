"use client";

import React, { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  
  return <>{children}</>;
};

export const DialogContent: React.FC<DialogContentProps> = ({ className = "", children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-lg w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = "", 
  ...props 
}) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = "", 
  ...props 
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className = "", 
  ...props 
}) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className = "", 
  ...props 
}) => (
  <p
    className={`text-sm text-gray-500 ${className}`}
    {...props}
  />
);

export const DialogClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  className = "", 
  ...props 
}) => (
  <button
    className={`absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 ${className}`}
    {...props}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
    <span className="sr-only">Close</span>
  </button>
);
