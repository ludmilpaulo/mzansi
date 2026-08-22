import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApplicationsScreenProps } from "../../navigation/types";
import { useGetApplicationsQuery } from "../../store/api";
import { theme } from "../../theme";
import type { ApplicationBucket } from "../../types/api";
import { getErrorMessage } from "../../utils/errors";

const BUCKETS: { key: ApplicationBucket; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function ApplicationsScreen({ navigation }: ApplicationsScreenProps<"ApplicationsList">) {
  const [bucket, setBucket] = useState<ApplicationBucket>("active");
  const query = useGetApplicationsQuery({ bucket });

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>Applications</Text>
      <View style={styles.chips}>
        {BUCKETS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setBucket(item.key)}
            style={[styles.chip, bucket === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, bucket === item.key && styles.chipLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button title="Start an application" onPress={() => navigation.navigate("NewApplication")} />
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.results.length === 0 ? (
        <EmptyState title="Nothing in this list" message="Applications in this status will appear here." />
      ) : null}
      {query.data?.results.map((item) => (
        <Card key={item.id} onPress={() => navigation.navigate("ApplicationDetail", { id: item.id })}>
          <Text style={styles.ref}>{item.reference}</Text>
          <Text style={styles.name}>{item.service.name}</Text>
          <StatusBadge label={item.status.label} />
          <Text style={styles.meta}>{item.next_action || item.status.description}</Text>
          <ProgressBar value={item.progress} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.title,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.white,
  },
  chipActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  chipLabel: {
    color: theme.colors.navy,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: theme.colors.white,
  },
  ref: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  name: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.charcoal,
    marginVertical: 4,
  },
  meta: {
    color: theme.colors.muted,
    marginVertical: 8,
  },
});
