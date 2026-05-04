import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

interface CommentDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const CommentDropdown: React.FC<CommentDropdownProps> = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="comment-dropdown-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className="comment-more-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', padding: '0 4px', display: 'flex', alignItems: 'center', lineHeight: 1 }}
      >
        <MoreHorizontal size={14} />
      </button>

      {isOpen && (
        <div className="comment-dropdown-menu" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          padding: '4px',
          zIndex: 10,
          minWidth: '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <button 
            onClick={() => { setIsOpen(false); onEdit(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', textAlign: 'left', width: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit2 size={14} /> Chỉnh sửa
          </button>
          <button 
            onClick={() => { setIsOpen(false); onDelete(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', textAlign: 'left', width: '100%', color: '#e53e3e' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};
