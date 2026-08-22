import { StyleSheet, Text, View } from "react-native";

import type { DocumentStatus } from "../types/api";
import { theme } from "../theme";

const DOCUMENT_TONES: Record<DocumentStatus, { background: string; color: string; label: string }> = {
  REQUESTED: { background: "#FEF3C7", color: theme.colors.warning, label: "Requested" },
  UPLOADED: { background: "#DBEAFE", color: theme.colors.info, label: "Uploaded" },
  UNDER_REVIEW: { background: "#E0E7FF", color: "#4338CA", label: "Under review" },
  VERIFIED: { background: "#DCFCE7", color: theme.colors.success, label: "Verified" },
  REJECTED: { background: "#FEE2E2", color: theme.colors.danger, label: "Rejected" },
  EXPIRED: { background: "#F1F5F9", color: theme.colors.muted, label: "Expired" },
  REPLACEMENT_REQUIRED: { background: "#FFEDD5", color: theme.colors.primaryDark, label: "Replacement required" },
};

interface StatusBadgeProps {
  status?: DocumentStatus | string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone =
    status && status in DOCUMENT_TONES
      ? DOCUMENT_TONES[status as DocumentStatus]
      : { background: "#E2E8F0", color: theme.colors.navy, label: label ?? status ?? "Status" };

  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Text style={[styles.label, { color: tone.color }]}>{label ?? tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
