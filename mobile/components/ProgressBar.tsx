import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.percent}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.caption,
  },
  track: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: "#FFE4D3",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
  },
  percent: {
    marginTop: theme.spacing.xs,
    color: theme.colors.navy,
    fontWeight: "700",
  },
});
