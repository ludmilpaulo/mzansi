import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import type { HomeScreenProps } from "../../navigation/types";
import { useGetAppointmentsQuery, useGetConversationsQuery, useGetDashboardQuery, useGetMeQuery } from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime, greetingForNow } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function HomeScreen({ navigation }: HomeScreenProps<"HomeHome">) {
  const me = useGetMeQuery();
  const dashboard = useGetDashboardQuery();
  const appointments = useGetAppointmentsQuery();
  const conversations = useGetConversationsQuery();

  const isLoading = (me.isLoading || dashboard.isLoading || appointments.isLoading || conversations.isLoading) && !dashboard.data;
  const error = me.error ?? dashboard.error ?? appointments.error ?? conversations.error;

  function refetchAll() {
    void me.refetch();
    void dashboard.refetch();
    void appointments.refetch();
    void conversations.refetch();
  }

  const active = dashboard.data?.active_application ?? null;
  const upcoming = (appointments.data?.results ?? [])
    .filter((item) => item.status !== "CANCELLED" && new Date(item.starts_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  const unread = (conversations.data?.results ?? []).reduce((sum, item) => sum + item.unread_count, 0);
  const firstName = me.data?.first_name || me.data?.full_name || "there";

  return (
    <Screen refreshing={dashboard.isFetching} onRefresh={refetchAll}>
      <Text style={styles.greeting}>
        {greetingForNow()}, {firstName}
      </Text>
      <Text style={styles.lede}>Your next step is shown below. We prepare applications; authorities decide outcomes.</Text>

      {isLoading ? <LoadingState /> : null}
      {error && !dashboard.data ? <ErrorState message={getErrorMessage(error)} onRetry={refetchAll} /> : null}

      {dashboard.data && !active ? (
        <EmptyState
          title="No active application"
          message="Start an application from a service, or book a consultation to discuss options."
          actionLabel="Browse services"
          onAction={() => navigation.navigate("Applications", { screen: "NewApplication" })}
        />
      ) : null}

      {active ? (
        <Card onPress={() => navigation.navigate("ApplicationDetail", { id: active.id })}>
          <Text style={styles.kicker}>Next action</Text>
          <Text style={styles.nextAction}>{active.next_action || "No client action recorded right now."}</Text>
          <Text style={styles.meta}>
            {active.reference} · {active.service.name} · {active.status.label}
          </Text>
          <Text style={styles.meta}>Mzansi status: {active.status.label}</Text>
          <Text style={styles.meta}>VFS status: {active.external_tracking?.status_label || "Not linked yet"}</Text>
          <ProgressBar value={active.progress} label="Application progress" />
          <Button title="View full tracking" variant="secondary" onPress={() => navigation.navigate("ApplicationTracking", { id: active.id })} />
          <View style={styles.counts}>
            <Count label="Documents" value={active.document_counts.total} />
            <Count label="Verified" value={active.document_counts.verified} />
            <Count label="Pending" value={active.document_counts.pending} />
            <Count label="In review" value={active.document_counts.under_review} />
          </View>
        </Card>
      ) : null}

      <Card onPress={() => navigation.navigate("BookConsultation")}>
        <Text style={styles.kicker}>Upcoming consultation</Text>
        {upcoming ? (
          <>
            <Text style={styles.cardTitle}>{upcoming.consultation_type.name}</Text>
            <Text style={styles.meta}>
              {formatDateTime(upcoming.starts_at)} · {upcoming.consultant_name} · {upcoming.status}
            </Text>
          </>
        ) : (
          <Text style={styles.meta}>No upcoming consultation. Book a time with your assigned consultant.</Text>
        )}
      </Card>

      <Card onPress={() => navigation.navigate("Messages", { screen: "ConversationsList" })}>
        <Text style={styles.kicker}>Messages</Text>
        <Text style={styles.cardTitle}>{unread > 0 ? `${unread} unread` : "No unread messages"}</Text>
      </Card>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Button title="Notifications" variant="secondary" onPress={() => navigation.navigate("Notifications")} />
        </View>
        <View style={styles.flex}>
          <Button title="Book consult" onPress={() => navigation.navigate("BookConsultation")} />
        </View>
      </View>
    </Screen>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: theme.typography.title,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  lede: {
    color: theme.colors.muted,
  },
  kicker: {
    color: theme.colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
    marginBottom: 6,
  },
  nextAction: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
  },
  meta: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  counts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  count: {
    alignItems: "center",
    flex: 1,
  },
  countValue: {
    fontWeight: "800",
    color: theme.colors.charcoal,
    fontSize: 18,
  },
  countLabel: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
