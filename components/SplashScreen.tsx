import { FC, useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Ждем немного перед началом затухания
    const startFadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 100);

    // Убираем компонент из DOM после завершения анимации
    const removeTimer = setTimeout(() => {
      setIsHidden(true);
      onComplete?.();
    }, 500); // 1.3s wait + 1s fade

    return () => {
      clearTimeout(startFadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 bg-black z-[99999] flex items-center justify-center transition-opacity duration-400 ease-in-out ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/assets/images/cognitive_dungeon_logo.png"
        alt="Cognitive Dungeon"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};
