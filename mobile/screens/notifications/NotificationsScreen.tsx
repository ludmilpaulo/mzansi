import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function NotificationsScreen() {
  const query = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>Notifications</Text>
      <Button title="Mark all read" variant="secondary" onPress={() => void markAll()} loading={markAllState.isLoading} />
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.results.length === 0 ? (
        <EmptyState title="No notifications" message="Status updates and document reviews will appear here." />
      ) : null}
      {query.data?.results.map((item) => (
        <Card key={item.id} onPress={() => void markRead(item.id)}>
          <Text style={[styles.name, !item.is_read && styles.unread]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.meta}>
            {formatDateTime(item.created_at)} · {item.category}
            {item.is_read ? "" : " · Unread"}
          </Text>
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
  name: {
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  unread: {
    fontWeight: "800",
    color: theme.colors.navy,
  },
  body: {
    marginTop: 6,
    color: theme.colors.charcoal,
  },
  meta: {
    marginTop: 6,
    color: theme.colors.muted,
  },
});
