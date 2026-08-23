import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import { useGetApplicationTrackingQuery, useRefreshApplicationTrackingMutation } from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

interface TrackingScreenProps {
  route: { params: { id: number } };
}

export function TrackingScreen({ route }: TrackingScreenProps) {
  const query = useGetApplicationTrackingQuery(route.params.id);
  const [refresh, refreshReq] = useRefreshApplicationTrackingMutation();
  const item = query.data;

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {item ? (
        <>
          <Text style={styles.kicker}>Application tracking</Text>
          <Text style={styles.title}>{item.service_name}</Text>
          <Text style={styles.meta}>Application #{item.application_reference}</Text>
          {item.reference_number ? <Text style={styles.meta}>VFS {item.reference_number}</Text> : null}

          <Card>
            <Text style={styles.kicker}>Mzansi case status</Text>
            <StatusBadge label={item.internal_status.label} />
            <Text style={styles.body}>This is your Mzansi file status. It is separate from the VFS report.</Text>
          </Card>

          <Card>
            <Text style={styles.kicker}>VFS status</Text>
            <StatusBadge label={item.status_label || "Not recorded yet"} />
            {item.manually_updated ? <Text style={styles.warning}>Manually updated</Text> : null}
            {item.passport_masked ? <Text style={styles.meta}>Passport {item.passport_masked}</Text> : null}
            <Text style={styles.meta}>Last checked {formatDateTime(item.checked_at)}</Text>
            <Text style={styles.meta}>Status source: {item.source_label || "Not retrieved"}</Text>
          </Card>

          <Text style={styles.section}>Application journey</Text>
          {item.journey.map((step) => (
            <View key={step.code} style={styles.step}>
              <Text style={styles.stepMark}>
                {step.state === "complete" ? "✓" : step.state === "current" ? "●" : "○"}
              </Text>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          ))}

          {refreshReq.isError ? <Text style={styles.error}>{getErrorMessage(refreshReq.error)}</Text> : null}
          {item.error_detail ? <Text style={styles.meta}>{item.error_detail}</Text> : null}

          <Button
            title="Refresh status"
            loading={refreshReq.isLoading}
            disabled={!item.can_refresh}
            onPress={() => void refresh(item.application_id)}
          />
          <Button
            title="Track on VFS Global"
            variant="secondary"
            onPress={() => void Linking.openURL(item.fallback_url)}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: theme.colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  meta: {
    color: theme.colors.muted,
    marginBottom: 4,
  },
  body: {
    color: theme.colors.charcoal,
    marginTop: 8,
    lineHeight: 22,
  },
  warning: {
    color: theme.colors.warning,
    fontWeight: "700",
    marginTop: 6,
  },
  section: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
    marginTop: theme.spacing.sm,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  stepMark: {
    width: 18,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  stepLabel: {
    color: theme.colors.charcoal,
    fontWeight: "600",
  },
  error: {
    color: theme.colors.danger,
  },
});
