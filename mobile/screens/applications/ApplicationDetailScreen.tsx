import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import { useGetApplicationQuery } from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

interface ApplicationDetailScreenProps {
  route: { params: { id: number } };
  navigation: { navigate: (name: "ApplicationTracking", params: { id: number }) => void };
}

export function ApplicationDetailScreen({ route, navigation }: ApplicationDetailScreenProps) {
  const query = useGetApplicationQuery(route.params.id);
  const application = query.data;

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {application ? (
        <>
          <Text style={styles.ref}>{application.reference}</Text>
          <Text style={styles.title}>{application.service.name}</Text>
          <StatusBadge label={application.status.label} />
          <Text style={styles.meta}>Consultant: {application.consultant_name || "To be assigned"}</Text>
          <Card>
            <Text style={styles.kicker}>Next action</Text>
            <Text style={styles.next}>{application.next_action || "No client action recorded right now."}</Text>
            <ProgressBar value={application.progress} label="Progress" />
            <Text style={styles.meta}>Mzansi status: {application.status.label}</Text>
            <Text style={styles.meta}>
              VFS status: {application.external_tracking?.status_label || "Not linked yet"}
            </Text>
            <Button title="Track application" variant="secondary" onPress={() => navigation.navigate("ApplicationTracking", { id: application.id })} />
          </Card>
          <Text style={styles.section}>Timeline</Text>
          {application.timeline.length === 0 ? <Text style={styles.meta}>No visible timeline events yet.</Text> : null}
          {application.timeline.map((event) => (
            <Card key={event.id}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.meta}>{formatDateTime(event.occurred_at)}</Text>
              {event.description ? <Text style={styles.body}>{event.description}</Text> : null}
              {event.client_action_required ? <Text style={styles.action}>Action required</Text> : null}
            </Card>
          ))}
          {application.notes.length > 0 ? (
            <View>
              <Text style={styles.section}>Notes</Text>
              {application.notes.map((note) => (
                <Card key={note.id}>
                  <Text style={styles.body}>{note.body}</Text>
                  <Text style={styles.meta}>{note.author_name || "Mzansi"} · {formatDateTime(note.created_at)}</Text>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ref: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  meta: {
    color: theme.colors.muted,
  },
  kicker: {
    color: theme.colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  next: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
    marginVertical: 8,
  },
  section: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
    marginTop: theme.spacing.sm,
  },
  eventTitle: {
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  body: {
    color: theme.colors.charcoal,
    lineHeight: 22,
  },
  action: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 6,
  },
});
