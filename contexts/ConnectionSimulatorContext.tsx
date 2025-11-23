import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { STORAGE_KEYS, KIOSK_SSID_KEYWORDS } from "@/constants/AppConstants";
import logger from "@/utils/Logger";

interface ConnectionSimulatorContextType {
  isConnectedToKiosk: boolean;
  isSimulatorEnabled: boolean;
  simulatedConnectionState: boolean;
  toggleSimulator: () => Promise<void>;
  setSimulatedConnectionState: (state: boolean) => Promise<void>;
}

const ConnectionSimulatorContext = createContext<ConnectionSimulatorContextType | undefined>(undefined);

const SIMULATOR_ENABLED_KEY = STORAGE_KEYS.SIMULATOR_ENABLED;
const SIMULATED_STATE_KEY = STORAGE_KEYS.SIMULATED_STATE;

export function ConnectionSimulatorProvider({ children }: { children: ReactNode }) {
  const [isSimulatorEnabled, setIsSimulatorEnabled] = useState(true); // Always enabled for development
  const [simulatedConnectionState, setSimulatedConnectionStateInternal] = useState(true); // Default to online
  const [realConnectionState, setRealConnectionState] = useState(false);

  // Load simulator settings from storage
  useEffect(() => {
    const loadSimulatorSettings = async () => {
      try {
        const [enabledValue, stateValue] = await Promise.all([
          AsyncStorage.getItem(SIMULATOR_ENABLED_KEY),
          AsyncStorage.getItem(SIMULATED_STATE_KEY),
        ]);

        if (enabledValue !== null) {
          setIsSimulatorEnabled(enabledValue === "true");
        }

        if (stateValue !== null) {
          setSimulatedConnectionStateInternal(stateValue === "true");
        }
      } catch (error) {
        logger.error("Error loading simulator settings:", error);
      }
    };

    loadSimulatorSettings();
  }, []);

  // Monitor real connection state with debouncing to prevent excessive calls
  const checkRealKioskConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();

      if (netInfo.type === "wifi" && netInfo.isConnected) {
        const ssid = netInfo.details && 'ssid' in netInfo.details ? netInfo.details.ssid : null;

        const isKiosk = ssid
          ? KIOSK_SSID_KEYWORDS.some((keyword) => ssid.toLowerCase().includes(keyword))
          : false;

        setRealConnectionState(isKiosk);
      } else {
        setRealConnectionState(false);
      }
    } catch (error) {
      logger.error("Error checking real kiosk connection:", error);
      setRealConnectionState(false);
    }
  }, []);

  // Set up network listener only once
  useEffect(() => {
    // Initial check
    checkRealKioskConnection();

    // Set up listener with debouncing
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = NetInfo.addEventListener((state) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce network state changes to prevent excessive calls
      debounceTimer = setTimeout(() => {
        checkRealKioskConnection();
      }, 300); // 300ms debounce
    });

    return () => {
      unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
    // Empty dependency array - only run once on mount
    // checkRealKioskConnection is stable due to useCallback with empty deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle simulator on/off
  const toggleSimulator = async () => {
    try {
      const newState = !isSimulatorEnabled;
      setIsSimulatorEnabled(newState);
      await AsyncStorage.setItem(SIMULATOR_ENABLED_KEY, newState.toString());
    } catch (error) {
      logger.error("Error toggling simulator:", error);
    }
  };

  // Set simulated connection state (online/offline)
  const setSimulatedConnectionState = async (state: boolean) => {
    try {
      setSimulatedConnectionStateInternal(state);
      await AsyncStorage.setItem(SIMULATED_STATE_KEY, state.toString());
    } catch (error) {
      logger.error("Error setting simulated connection state:", error);
    }
  };

  // Determine effective connection state
  const isConnectedToKiosk = isSimulatorEnabled ? simulatedConnectionState : realConnectionState;

  return (
    <ConnectionSimulatorContext.Provider
      value={{
        isConnectedToKiosk,
        isSimulatorEnabled,
        simulatedConnectionState,
        toggleSimulator,
        setSimulatedConnectionState,
      }}
    >
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
