import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  buttonClassName?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  items, 
  buttonClassName = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Calculate ideal position for the dropdown
      // Positioning to the right of the button, aligned with the bottom
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 150 + window.scrollX // 150px is roughly the width of dropdown
      });
    }
    
    setIsOpen(!isOpen);
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Close when pressing escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        onClick={toggleMenu} 
        className={`p-2 rounded-full hover:bg-gray-100 ${buttonClassName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} className="text-gray-600" />
      </button>
      
      {isOpen && (
        <div 
          className="fixed w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={{
            position: 'fixed', 
            top: position.top, 
            left: position.left,
            zIndex: 9999
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick(e);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${item.className || ''}`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;