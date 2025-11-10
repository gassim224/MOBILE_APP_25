import { View, Text, StyleSheet } from "react-native";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export default function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <View style={[styles.container, isConnected ? styles.connected : styles.offline]}>
      <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotOffline]} />
      <Text style={styles.text}>
        {isConnected ? "🟢 Connecté au kiosque" : "🔴 Hors ligne"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  connected: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },
  offline: {
    backgroundColor: "rgba(220, 53, 69, 0.15)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotConnected: {
    backgroundColor: "#4CAF50",
  },
  dotOffline: {
    backgroundColor: "#DC3545",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
