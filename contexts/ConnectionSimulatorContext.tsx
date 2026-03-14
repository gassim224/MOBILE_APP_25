import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import logger from "@/utils/Logger";

// Raspberry Pi kiosk IP — same as API base
const KIOSK_PING_URL = "http://10.42.0.1:8001/";
const PING_TIMEOUT_MS = 3000;
const PING_INTERVAL_MS = 8000;

interface ConnectionSimulatorContextType {
  isConnectedToKiosk: boolean;
}

const ConnectionSimulatorContext = createContext<ConnectionSimulatorContextType | undefined>(undefined);

export function ConnectionSimulatorProvider({ children }: { children: ReactNode }) {
  const [isConnectedToKiosk, setIsConnectedToKiosk] = useState(false);

  const pingKiosk = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

      try {
        await fetch(KIOSK_PING_URL, {
          method: "GET",
          signal: controller.signal,
        });
        // Any response (including 404/500) means server is reachable
        return true;
      } catch {
        // AbortError = timeout, TypeError = no network — both mean offline
        return false;
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return false;
    }
  }, []);

  const checkKioskConnection = useCallback(async () => {
    try {
      // Quick first check: must be on WiFi at all
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || netInfo.type !== "wifi") {
        setIsConnectedToKiosk(false);
        return;
      }

      // Then confirm kiosk is reachable by direct ping
      const reachable = await pingKiosk();
      setIsConnectedToKiosk(reachable);
    } catch (error) {
      logger.error("Error checking kiosk connection:", error);
      setIsConnectedToKiosk(false);
    }
  }, [pingKiosk]);

  useEffect(() => {
    checkKioskConnection();

    // Re-check whenever network state changes
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = NetInfo.addEventListener(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkKioskConnection();
      }, 500);
    });

    // Also poll periodically to catch kiosk going on/offline without network events
    const pollInterval = setInterval(checkKioskConnection, PING_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
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
