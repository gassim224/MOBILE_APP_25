import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

interface ConnectionSimulatorContextType {
  isConnectedToKiosk: boolean;
  isSimulatorEnabled: boolean;
  simulatedConnectionState: boolean;
  toggleSimulator: () => Promise<void>;
  setSimulatedConnectionState: (state: boolean) => Promise<void>;
}

const ConnectionSimulatorContext = createContext<ConnectionSimulatorContextType | undefined>(undefined);

const SIMULATOR_ENABLED_KEY = "@connection_simulator_enabled";
const SIMULATED_STATE_KEY = "@connection_simulated_state";

export function ConnectionSimulatorProvider({ children }: { children: ReactNode }) {
  const [isSimulatorEnabled, setIsSimulatorEnabled] = useState(false);
  const [simulatedConnectionState, setSimulatedConnectionStateInternal] = useState(false);
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
        console.error("Error loading simulator settings:", error);
      }
    };

    loadSimulatorSettings();
  }, []);

  // Monitor real connection state
  const checkRealKioskConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();

      if (netInfo.type === "wifi" && netInfo.isConnected) {
        const ssid = netInfo.details && 'ssid' in netInfo.details ? netInfo.details.ssid : null;

        const isKiosk = ssid ?
          (ssid.toLowerCase().includes("ecole") ||
           ssid.toLowerCase().includes("school") ||
           ssid.toLowerCase().includes("kiosk")) :
          false;

        setRealConnectionState(isKiosk);
      } else {
        setRealConnectionState(false);
      }
    } catch (error) {
      console.error("Error checking real kiosk connection:", error);
      setRealConnectionState(false);
    }
  }, []);

  useEffect(() => {
    checkRealKioskConnection();

    const unsubscribe = NetInfo.addEventListener(() => {
      checkRealKioskConnection();
    });

    return () => {
      unsubscribe();
    };
  }, [checkRealKioskConnection]);

  // Toggle simulator on/off
  const toggleSimulator = async () => {
    try {
      const newState = !isSimulatorEnabled;
      setIsSimulatorEnabled(newState);
      await AsyncStorage.setItem(SIMULATOR_ENABLED_KEY, newState.toString());
    } catch (error) {
      console.error("Error toggling simulator:", error);
    }
  };

  // Set simulated connection state (online/offline)
  const setSimulatedConnectionState = async (state: boolean) => {
    try {
      setSimulatedConnectionStateInternal(state);
      await AsyncStorage.setItem(SIMULATED_STATE_KEY, state.toString());
    } catch (error) {
      console.error("Error setting simulated connection state:", error);
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
