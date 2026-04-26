import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { brandTokens } from '../theme/brand';

type SortableQuestionBlockProps = {
  id: string;
  children: React.ReactNode;
};

export const SortableQuestionBlock: React.FC<SortableQuestionBlockProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.92 : 1,
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="اسحب لتغيير الترتيب"
        aria-label="اسحب لتغيير ترتيب السؤال"
        style={{
          position: 'absolute',
          top: '22px',
          insetInlineEnd: '-46px',
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          border: `1px solid ${brandTokens.border}`,
          background: '#ffffff',
          color: brandTokens.textSoft,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDragging ? '0 12px 28px rgba(18, 58, 63, 0.18)' : '0 4px 12px rgba(18, 58, 63, 0.08)',
          touchAction: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </button>
      {children}
    </div>
  );
};
