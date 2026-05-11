'use client';

import React from 'react';
import { CARD_WIDTH, CARD_HEIGHT } from '@/app/lib/constants';

interface CardWrapperProps {
  children: React.ReactNode;
  id?: string;
  scale?: number;
  className?: string;
}

export default function CardWrapper({ children, id, scale = 1, className = '' }: CardWrapperProps) {
  return (
    <div
      id={id}
      className={className}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: "'Noto Sans KR', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}
