import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Unable to load</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  message: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    lineHeight: 22,
  },
});
