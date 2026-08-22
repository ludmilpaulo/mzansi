import { StyleSheet, Text } from "react-native";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import type { MessagesScreenProps } from "../../navigation/types";
import { useGetConversationsQuery } from "../../store/api";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function MessagesScreen({ navigation }: MessagesScreenProps<"ConversationsList">) {
  const query = useGetConversationsQuery();

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>Messages</Text>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.results.length === 0 ? (
        <EmptyState
          title="No conversations"
          message="A conversation is created with each application so you can message the assigned team."
        />
      ) : null}
      {query.data?.results.map((item) => (
        <Card
          key={item.id}
          onPress={() =>
            navigation.navigate("ConversationThread", {
              id: item.id,
              title: item.subject || item.application_reference,
            })
          }
        >
          <Text style={styles.name}>{item.subject || item.application_reference}</Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.last_message?.body || "No messages yet."}
          </Text>
          <Text style={styles.meta}>
            {formatDateTime(item.updated_at)}
            {item.unread_count > 0 ? ` · ${item.unread_count} unread` : ""}
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
    fontWeight: "700",
    color: theme.colors.navy,
    fontSize: theme.typography.subtitle,
  },
  body: {
    color: theme.colors.charcoal,
    marginTop: 6,
  },
  meta: {
    color: theme.colors.muted,
    marginTop: 6,
  },
});
