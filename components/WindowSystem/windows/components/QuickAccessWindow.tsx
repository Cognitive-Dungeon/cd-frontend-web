import type { FC, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Item } from "../../../../types";

import { InventorySlot } from "./InventorySlot";

/**

 * QuickAccessWindow

 *

 * Minimal horizontal strip of universal inventory slots without decorations,

 * similar to Turn Order Bar styling philosophy.

 * Uses slots from inventory and forwards right-click context action to "USE".

 *

 * FIXME: Quick access currently stores full Item objects in slots.
 *        In the future, this should be refactored to store only stable item IDs
 *        and resolve them against the latest inventory state.
 */

interface QuickAccessWindowProps {
  slots: Array<Item | null>;
  /**
   * Full, up-to-date inventory items for resolving drops by id.
   * FIXME: In future, quick access should store only item ids and resolve them via this collection.
   */
  inventoryItems: Item[];

  totalSlots?: number;

  onUsePinnedItem?: (item: Item) => void;
  onDropItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  onInspectItem?: (item: Item) => void;
  equipment?: Array<Item>;
}

export const QuickAccessWindow: FC<QuickAccessWindowProps> = ({
  slots,
  inventoryItems,
  totalSlots,
  onUsePinnedItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onInspectItem,
  equipment,
}) => {
  const count = useMemo(() => {
    const base = Array.isArray(slots) ? slots.length : 0;
    const requested = totalSlots ?? base;
    return requested > 0 ? requested : base;
  }, [slots, totalSlots]);

  const [slotItems, setSlotItems] = useState<Array<Item | null>>(() => {
    const initialLength = count;
    const next: Array<Item | null> = new Array(initialLength).fill(null);
    for (let i = 0; i < initialLength; i += 1) {
      next[i] = slots[i] ?? null;
    }
    return next;
  });

  const [draggedItem, setDraggedItem] = useState<{
    item: Item;
    slotIndex: number;
  } | null>(null);

  // Global drop listener to handle drops on game grid
  useEffect(() => {
    const handleGlobalDrop = (e: globalThis.DragEvent) => {
      const target = e.target as HTMLElement;
      const isOnSlot = target.closest("[data-inventory-slot]");
      const isOnGameGrid = target.closest("[data-game-grid]");
      const dragSource = e.dataTransfer?.getData("dragSource");

      if (!isOnSlot && isOnGameGrid && draggedItem?.item) {
        // If dragged from QuickAccess, just unpin (remove from slot)
        // Don't call onDropItem - item stays in inventory
        if (dragSource === "quickaccess") {
          // Clear the slot
          setSlotItems((prev) => {
            const next = [...prev];
            next[draggedItem.slotIndex] = null;
            return next;
          });
          setDraggedItem(null);
        } else {
          // If dragged from inventory, drop item to ground
          onDropItem?.(draggedItem.item);
          setDraggedItem(null);
        }
      }
    };

    window.addEventListener("drop", handleGlobalDrop as EventListener);
    return () =>
      window.removeEventListener("drop", handleGlobalDrop as EventListener);
  }, [draggedItem, onDropItem]);

  const handleSlotDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent event from bubbling to container

      const itemId = event.dataTransfer.getData("itemId");

      if (!itemId) {
        // Debug log: no itemId found in drop event
        // eslint-disable-next-line no-console
        console.debug(
          "[QuickAccess] Drop ignored: missing itemId in dataTransfer",
        );

        return;
      }

      const sourceItem =
        (inventoryItems ?? []).find((candidate) => candidate.id === itemId) ??
        null;

      // Debug log: show result of resolving item from inventory
      // eslint-disable-next-line no-console
      console.debug("[QuickAccess] handleSlotDrop", {
        itemId,
        resolved: !!sourceItem,
        slotIndex,
        inventorySize: (inventoryItems ?? []).length,
      });

      if (!sourceItem) {
        return;
      }

      setSlotItems((prev) => {
        const next = [...prev];
        next[slotIndex] = sourceItem;
        return next;
      });
    },
    [inventoryItems],
  );

  const handleSlotDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent event from bubbling to container
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop outside of slots (to drop item)
  const handleDropOutsideSlots = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const target = e.target as HTMLElement;
      const isOnSlot = target.closest("[data-inventory-slot]");

      if (!isOnSlot && draggedItem?.item) {
        onDropItem?.(draggedItem.item);
        setDraggedItem(null);
      }
    },
    [draggedItem, onDropItem],
  );

  const handleContainerDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleContainerDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    },
    [],
  );

  return (
    <div
      className="flex items-center gap-2 px-1 py-0.5"
      onDrop={handleDropOutsideSlots}
      onDragOver={handleContainerDragOver}
      onDragEnter={handleContainerDragEnter}
    >
      {Array.from({ length: count }).map((_, i) => {
        const item = slotItems[i] ?? null;

        return (
          <div
            key={i}
            onDragOver={handleSlotDragOver}
            onDrop={(event) => handleSlotDrop(event, i)}
            className="flex items-center justify-center"
          >
            <InventorySlot
              item={item}
              className="w-[45px] h-[45px]"
              unavailable={
                item
                  ? !inventoryItems.some((invItem) => invItem.id === item.id)
                  : false
              }
              onUse={(itm) => {
                if (itm) {
                  onUsePinnedItem?.(itm);
                }
              }}
              onDrop={onDropItem}
              onEquip={onEquipItem}
              onUnequip={onUnequipItem}
              onInspect={onInspectItem}
              isEquipped={
                item ? equipment?.some((eq) => eq.id === item.id) : false
              }
              onDragStart={(itm) => {
                setDraggedItem({ item: itm, slotIndex: i });
              }}
              onDragEnd={() => {
                setDraggedItem(null);
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default QuickAccessWindow;
