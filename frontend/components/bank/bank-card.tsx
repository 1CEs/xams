"use client";

import React, { SVGProps, useState, useRef, useEffect } from "react";
import { BankEmpty, BankFill } from "../icons/icons";

export type BankNode = {
  id: string;
  title: string;
  examId?: string;
  subBanks?: BankNode[];
};

type Props = {
  id: string;
  title: string;
  examId?: string;
  exam_ids?: string[];
  subBanks?: BankNode[];
  className?: string;
  fetchSubBanks?: (id: string) => Promise<BankNode[]>;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
};
const BankCard = ({ id, title, examId, exam_ids = [], subBanks = [], className, onDoubleClick, onRename, onDelete }: Props) => {
  // Check if the bank is empty (no exams and no sub-banks)
  const isEmpty = !examId && (!exam_ids || exam_ids.length === 0) && (!subBanks || subBanks.length === 0);
  
  // State for context menu
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(title);
  
  // New sub-bank creation handler
  const handleNew = () => {
    setShowContextMenu(false);
    // Trigger the parent component's new bank creation modal
    // This will be implemented in the parent component
    if (window.dispatchEvent) {
      const event = new CustomEvent('createSubBank', { detail: { parentId: id } });
      window.dispatchEvent(event);
    }
  };
  
  // Refs for handling clicks outside
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Handle double click event
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDoubleClick) {
      onDoubleClick(e);
    }
  };
  
  // Handle right click event
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  // Handle rename action
  const handleRename = () => {
    setIsRenaming(true);
    setShowContextMenu(false);
    // Focus the input after rendering
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 10);
  };
  
  // Handle delete action
  const handleDelete = () => {
    setShowContextMenu(false);
    if (onDelete) {
      onDelete(id);
    }
  };
  
  // Handle rename submit
  const handleRenameSubmit = () => {
    if (onRename && newName.trim() !== '') {
      onRename(id, newName);
    }
    setIsRenaming(false);
  };
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
      
      // For rename input, submit on click outside
      if (isRenaming && renameInputRef.current && !renameInputRef.current.contains(event.target as Node)) {
        handleRenameSubmit();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRenaming, newName]);

  return (
    <div className={className} ref={cardRef}>
      <div 
        className="flex flex-col items-center w-full relative"
        onDoubleClick={handleDoubleClick}
      >
        <div onContextMenu={handleContextMenu} className="flex justify-center items-center cursor-pointer">
          {isEmpty ? (
            <BankEmpty width={100}/>
          ) : (
            <BankFill width={100}/>
          )}
        </div>
        <div className="flex flex-col items-center">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              className="text-sm font-medium w-full text-center border border-secondary rounded px-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                } else if (e.key === 'Escape') {
                  setNewName(title);
                  setIsRenaming(false);
                }
              }}
            />
          ) : (
            <p className="text-sm font-medium truncate w-full text-center pt-3">{title}</p>
          )}
        </div>
      </div>
      
      {/* Context Menu */}
      {showContextMenu && (
        <div 
          ref={contextMenuRef}
          className="absolute bg-[#202020] shadow-lg rounded-md py-1 z-50 min-w-[150px]"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-[#303030] flex items-center gap-2"
            onClick={handleNew}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            New
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-[#303030] flex items-center gap-2"
            onClick={handleRename}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Rename
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-[#303030] text-red-500 flex items-center gap-2"
            onClick={handleDelete}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BankCard;
