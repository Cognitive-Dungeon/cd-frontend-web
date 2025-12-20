import {LucideIcon} from "lucide-react";
import {FC, useEffect, useState} from "react";
import {createPortal} from "react-dom";

import {Entity} from "../types";

interface RadialMenuAction {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
}

interface RadialMenuProps {
  x: number;
  y: number;
  entity: Entity;
  actions: RadialMenuAction[];
  onAction: (actionId: string, entity: Entity) => void;
  onClose: () => void;
  cellSize: number;
  zoom: number;
}

export const RadialMenu: FC<RadialMenuProps> = ({
  x,
  y,
  entity,
  actions,
  onAction,
  onClose,
  cellSize,
  zoom,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const handleClick = (e: MouseEvent) => {
      // Check if click is inside any action button
      const target = e.target as HTMLElement;
      const actionButton = target.closest("[data-action-id]");

      if (actionButton) {
        // Execute action
        const actionId = actionButton.getAttribute("data-action-id");
        if (actionId) {
          onAction(actionId, entity);
        }
      }

      // Close menu with animation
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 200);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Track which action is being hovered
      const menuX = x + cellSize / 2;
      const menuY = y + cellSize / 2;
      const dx = e.clientX - menuX;
      const dy = e.clientY - menuY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If too close to center, no hover
      if (distance < 20) {
        setHoveredAction(null);
        return;
      }

      // Calculate angle
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Find which action this angle corresponds to
      const actionCount = actions.length;
      const anglePerAction = 360 / actionCount;
      const startAngle = -90 - anglePerAction / 2; // Start from top

      for (let i = 0; i < actionCount; i++) {
        const actionAngle = startAngle + i * anglePerAction;
        const normalizedAngle = (angle - actionAngle + 360) % 360;

        if (
          normalizedAngle < anglePerAction &&
          distance > 20 &&
          distance < 100
        ) {
          setHoveredAction(actions[i].id);
          return;
        }
      }

      setHoveredAction(null);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hoveredAction, onAction, onClose, entity, actions, x, y, cellSize]);

  const radius = 60 * zoom; // Distance from center to action buttons
  const buttonSize = 40 * zoom;

  const menuContent = (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: cellSize,
        height: cellSize,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {/* Center indicator */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 8 * zoom,
          height: 8 * zoom,
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0})`,
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Action buttons */}
      {actions.map((action, index) => {
        const angle = (360 / actions.length) * index - 90; // Start from top
        const radian = (angle * Math.PI) / 180;
        const offsetX = Math.cos(radian) * radius;
        const offsetY = Math.sin(radian) * radius;

        const isHovered = hoveredAction === action.id;
        const delay = index * 0.03; // Stagger animation

        return (
          <div
            key={action.id}
            data-action-id={action.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: buttonSize,
              height: buttonSize,
              transform: `translate(-50%, -50%) translate(${isVisible ? offsetX : 0}px, ${isVisible ? offsetY : 0}px) scale(${isVisible ? (isHovered ? 1.3 : 1) : 0})`,
              transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s, background-color 0.2s`,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                backgroundColor: isHovered ? action.color : `${action.color}dd`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: "white",
                boxShadow: isHovered
                  ? `0 0 20px ${action.color}, 0 4px 12px rgba(0, 0, 0, 0.4)`
                  : "0 2px 8px rgba(0, 0, 0, 0.3)",
                border: isHovered
                  ? "2px solid white"
                  : "2px solid rgba(255, 255, 255, 0.3)",
                transition: "all 0.2s",
              }}
            >
              <action.icon size={20 * zoom} strokeWidth={2.5} />
            </div>

            {/* Label tooltip */}
            {isHovered && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translateY(-${50 * zoom}px)`,
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  color: "white",
                  padding: `${4 * zoom}px ${8 * zoom}px`,
                  borderRadius: `${4 * zoom}px`,
                  fontSize: `${12 * zoom}px`,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  zIndex: 1001,
                  animation: "fadeIn 0.2s",
                }}
              >
                {action.label}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-${45 * zoom}px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-${50 * zoom}px);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(menuContent, document.body);
};
