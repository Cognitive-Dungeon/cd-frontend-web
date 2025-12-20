import {WindowConfig} from "../types";

import CasinoWindow from "./components/CasinoWindow";

export const CASINO_WINDOW_ID = "easter-egg-casino";

interface CasinoWindowOptions {
  onClose: () => void;
}

export const createCasinoWindowConfig = ({
  onClose,
}: CasinoWindowOptions): WindowConfig => ({
  id: CASINO_WINDOW_ID,
  title: "Крутим КАЗИНО",
  closeable: true,
  minimizable: true,
  resizable: false,
  showInDock: true,
  lockSize: true,
  defaultOrigin: { x: 0.5, y: 0.5 }, // center of window
  defaultPosition: { x: 0.5, y: 0.5 }, // center of viewport
  defaultSize: { width: 500, height: 400 },
  content: <CasinoWindow onClose={onClose} />,
});
