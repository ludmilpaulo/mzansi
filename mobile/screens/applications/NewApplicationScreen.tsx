import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import type { ApplicationsScreenProps } from "../../navigation/types";
import { useCreateApplicationMutation, useGetServicesQuery } from "../../store/api";
import { theme } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export function NewApplicationScreen({ navigation }: ApplicationsScreenProps<"NewApplication">) {
  const services = useGetServicesQuery();
  const [createApplication, createState] = useCreateApplicationMutation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  async function onCreate() {
    if (!selectedSlug) {
      return;
    }
    try {
      const created = await createApplication({ service: selectedSlug }).unwrap();
      navigation.replace("ApplicationDetail", { id: created.id });
    } catch {
      // Shown below.
    }
  }

  return (
    <Screen refreshing={services.isFetching} onRefresh={() => void services.refetch()}>
      <Text style={styles.title}>Start an application</Text>
      <Text style={styles.subtitle}>Choose a service from the current catalogue. Starting a file does not guarantee approval.</Text>
      {services.isLoading ? <LoadingState /> : null}
      {services.isError ? (
        <ErrorState message={getErrorMessage(services.error)} onRetry={() => void services.refetch()} />
      ) : null}
      {services.data && services.data.length === 0 ? (
        <EmptyState title="No services available" message="Services are loaded from the API and none are published yet." />
      ) : null}
      {services.data?.map((service) => (
        <Card key={service.slug} onPress={() => setSelectedSlug(service.slug)}>
          <Text style={styles.name}>{service.name}</Text>
          <Text style={styles.body}>{service.short_description}</Text>
          {service.estimated_processing ? <Text style={styles.meta}>{service.estimated_processing}</Text> : null}
          {selectedSlug === service.slug ? <Text style={styles.selected}>Selected</Text> : null}
        </Card>
      ))}
      {createState.isError ? <Text style={styles.error}>{getErrorMessage(createState.error)}</Text> : null}
      <Button title="Create application" onPress={() => void onCreate()} loading={createState.isLoading} disabled={!selectedSlug} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.title,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  subtitle: {
    color: theme.colors.muted,
  },
  name: {
    fontWeight: "700",
    fontSize: theme.typography.subtitle,
    color: theme.colors.navy,
  },
  body: {
    color: theme.colors.charcoal,
    marginTop: 6,
  },
  meta: {
    color: theme.colors.muted,
    marginTop: 6,
  },
  selected: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 8,
  },
  error: {
    color: theme.colors.danger,
  },
});
