import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import { KIOSK_SSID_KEYWORDS } from "@/constants/AppConstants";
import logger from "@/utils/Logger";

interface ConnectionSimulatorContextType {
  isConnectedToKiosk: boolean;
}

const ConnectionSimulatorContext = createContext<ConnectionSimulatorContextType | undefined>(undefined);

export function ConnectionSimulatorProvider({ children }: { children: ReactNode }) {
  const [isConnectedToKiosk, setIsConnectedToKiosk] = useState(false);

  const checkKioskConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();

      if (netInfo.type === "wifi" && netInfo.isConnected) {
        const ssid = netInfo.details && 'ssid' in netInfo.details ? netInfo.details.ssid : null;

        const isKiosk = ssid
          ? KIOSK_SSID_KEYWORDS.some((keyword) => ssid.toLowerCase().includes(keyword))
          : false;

        setIsConnectedToKiosk(isKiosk);
      } else {
        setIsConnectedToKiosk(false);
      }
    } catch (error) {
      logger.error("Error checking kiosk connection:", error);
      setIsConnectedToKiosk(false);
    }
  }, []);

  useEffect(() => {
    checkKioskConnection();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = NetInfo.addEventListener(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkKioskConnection();
      }, 300);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ConnectionSimulatorContext.Provider value={{ isConnectedToKiosk }}>
      {children}
    </ConnectionSimulatorContext.Provider>
  );
}

export function useConnectionSimulator() {
  const context = useContext(ConnectionSimulatorContext);
  if (context === undefined) {
    throw new Error("useConnectionSimulator must be used within a ConnectionSimulatorProvider");
  }
  return context;
}
