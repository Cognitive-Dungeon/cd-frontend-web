import { useLayoutEffect, useState, RefObject } from "react";

interface MenuPosition {
  x: number;
  y: number;
}

interface UseContextMenuPositionOptions {
  /**
   * Initial position (e.g., from mouse click or element position)
   */
  initialPosition: MenuPosition;
  /**
   * Ref to the menu element for measuring actual dimensions
   */
  menuRef: RefObject<HTMLElement>;
  /**
   * Whether the menu is currently shown
   */
  isOpen: boolean;
  /**
   * Optional approximate menu dimensions (used as fallback before menu is measured)
   */
  approximateSize?: {
    width?: number;
    height?: number;
  };
  /**
   * Padding from viewport edges (default: 10px)
   */
  edgePadding?: number;
}

/**
 * Hook for calculating context menu position that stays within viewport bounds.
 *
 * Automatically adjusts menu position to prevent it from going off-screen.
 * Uses useLayoutEffect to measure menu dimensions and adjust position before paint.
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 * const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
 *
 * const position = useContextMenuPosition({
 *   initialPosition: clickPosition,
 *   menuRef,
 *   isOpen,
 * });
 *
 * return (
 *   <div
 *     ref={menuRef}
 *     style={{ left: position.x, top: position.y }}
 *   >
 *     Menu content
 *   </div>
 * );
 * ```
 */
export const useContextMenuPosition = ({
  initialPosition,
  menuRef,
  isOpen,
  approximateSize = { width: 200, height: 300 },
  edgePadding = 10,
}: UseContextMenuPositionOptions): MenuPosition => {
  const [position, setPosition] = useState<MenuPosition>(initialPosition);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let menuWidth = approximateSize.width || 200;
    let menuHeight = approximateSize.height || 300;

    // If menu ref is available, use actual dimensions
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      menuWidth = rect.width;
      menuHeight = rect.height;
    }

    let left = initialPosition.x;
    let top = initialPosition.y;

    // Check if menu goes beyond right edge
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - edgePadding;
    }

    // Check if menu goes beyond bottom edge
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - edgePadding;
    }

    // Check if menu goes beyond left edge
    if (left < edgePadding) {
      left = edgePadding;
    }

    // Check if menu goes beyond top edge
    if (top < edgePadding) {
      top = edgePadding;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    setPosition({ x: left, y: top });
  }, [
    isOpen,
    initialPosition.x,
    initialPosition.y,
    approximateSize.width,
    approximateSize.height,
    edgePadding,
    menuRef,
  ]);

  return position;
};
