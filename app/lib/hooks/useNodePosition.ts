'use client';

import { useEffect, useState } from 'react';

interface UsePopoverNodePositionParams {
  popoverRef: React.RefObject<HTMLElement>;
  popoverTriggerRef: React.RefObject<HTMLElement>;
  alignment?: 'left' | 'center' | 'right';
  isOpen?: boolean;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  placement: 'bottom' | 'top';
}

export default function usePopoverNodePosition({
  popoverRef,
  popoverTriggerRef,
  alignment = 'left',
  isOpen = false,
}: UsePopoverNodePositionParams): DropdownPosition {
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
  });

  useEffect(() => {
    function calculatePosition() {
      if (!popoverRef.current || !popoverTriggerRef.current) return;
      const buttonRect = popoverTriggerRef.current.getBoundingClientRect();
      const popoverHeight = popoverRef.current.offsetHeight;
      const popoverWidth = popoverRef.current.offsetWidth;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      const placement = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

      const containerRect = popoverRef.current.offsetParent?.getBoundingClientRect() ?? {
        top: 0,
        left: 0,
      };

      let left = buttonRect.left - containerRect.left;
      const top =
        placement === 'bottom'
          ? buttonRect.bottom - containerRect.top
          : buttonRect.top - popoverHeight - containerRect.top;
      const width = buttonRect.width;

      if (alignment === 'center') {
        left = left + buttonRect.width / 2 - popoverWidth / 2;
        left = Math.max(0, left);
      }
      if (alignment === 'right') {
        left = left + buttonRect.width - popoverWidth;
        left = Math.max(0, left);
      }

      setDropdownPosition({ top, left, width, placement });
    }

    if (isOpen) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
    }
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [popoverRef, popoverTriggerRef, alignment, isOpen]);

  return dropdownPosition;
}