import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  message: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
  },
});
