import React from 'react';
import { ahk } from '../../lib/ahk';

export const TooltipWrapper = ({ text, children }: { text: string, children: React.ReactNode }) => {
  return (
    <div
      onMouseEnter={() => { }}
      onMouseLeave={() => { }}
      title={text}
      className="inline-flex items-center justify-center cursor-pointer"
    >
      {children}
    </div>
  );
};
