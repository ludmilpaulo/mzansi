import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} /> : null}
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
