import {BASE_CELL_SIZE} from "../constants";

/**
 * Вычисляет размер клетки с учетом зума
 * @param zoom - текущий уровень зума (по умолчанию 1)
 * @returns размер клетки в пикселях
 */
export function getCellSize(zoom: number = 1): number {
  return BASE_CELL_SIZE * zoom;
}

/**
 * Вычисляет пиксельную позицию центра клетки
 * @param gridX - координата X на сетке
 * @param gridY - координата Y на сетке
 * @param zoom - текущий уровень зума
 * @returns объект с координатами x и y в пикселях
 */
export function getCellCenterPixelPosition(
  gridX: number,
  gridY: number,
  zoom: number = 1,
): { x: number; y: number } {
  const cellSize = getCellSize(zoom);
  return {
    x: gridX * cellSize + cellSize / 2,
    y: gridY * cellSize + cellSize / 2,
  };
}

/**
 * Вычисляет пиксельную позицию верхнего левого угла клетки
 * @param gridX - координата X на сетке
 * @param gridY - координата Y на сетке
 * @param zoom - текущий уровень зума
 * @returns объект с координатами x и y в пикселях
 */
export function getCellPixelPosition(
  gridX: number,
  gridY: number,
  zoom: number = 1,
): { x: number; y: number } {
  const cellSize = getCellSize(zoom);
  return {
    x: gridX * cellSize,
    y: gridY * cellSize,
  };
}

/**
 * Преобразует пиксельные координаты в координаты сетки
 * @param pixelX - координата X в пикселях
 * @param pixelY - координата Y в пикселях
 * @param zoom - текущий уровень зума
 * @returns объект с координатами x и y на сетке
 */
export function pixelToGridPosition(
  pixelX: number,
  pixelY: number,
  zoom: number = 1,
): { x: number; y: number } {
  const cellSize = getCellSize(zoom);
  return {
    x: Math.floor(pixelX / cellSize),
    y: Math.floor(pixelY / cellSize),
  };
}

/**
 * Вычисляет смещение камеры для центрирования позиции
 * @param gridX - координата X на сетке
 * @param gridY - координата Y на сетке
 * @param containerWidth - ширина контейнера в пикселях
 * @param containerHeight - высота контейнера в пикселях
 * @param zoom - текущий уровень зума
 * @returns объект со смещениями x и y
 */
export function calculateCameraOffset(
  gridX: number,
  gridY: number,
  containerWidth: number,
  containerHeight: number,
  zoom: number = 1,
): { x: number; y: number } {
  const { x: pixelX, y: pixelY } = getCellCenterPixelPosition(
    gridX,
    gridY,
    zoom,
  );

  return {
    x: containerWidth / 2 - pixelX,
    y: containerHeight / 2 - pixelY,
  };
}
