import type { FC } from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  loginError: string | null;
}

export const ConnectionStatus: FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  reconnectAttempt,
  loginError,
}) => {
  return (
    <>
      {/* Индикатор подключения */}
      {!isConnected && !isReconnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          <span className="font-semibold">Подключение к серверу...</span>
        </div>
      )}

      {/* Индикатор переподключения */}
      {isReconnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          <span className="font-semibold">
            Переподключение... (попытка {reconnectAttempt}/10)
          </span>
        </div>
      )}

      {/* Ошибка аутентификации */}
      {loginError && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span className="font-semibold">Ошибка входа: {loginError}</span>
        </div>
      )}
    </>
  );
};
