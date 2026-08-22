import { StyleSheet, Text } from "react-native";

import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { StatusBadge } from "../../components/StatusBadge";
import { useGetInvoicesQuery } from "../../store/api";
import { theme } from "../../theme";
import { formatDate } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function InvoicesScreen() {
  const query = useGetInvoicesQuery();

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>Invoices</Text>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.results.length === 0 ? (
        <EmptyState title="No invoices" message="Issued invoices for consultations or applications will appear here." />
      ) : null}
      {query.data?.results.map((invoice) => (
        <Card key={invoice.id}>
          <Text style={styles.number}>{invoice.number}</Text>
          <Text style={styles.body}>{invoice.description}</Text>
          <StatusBadge label={invoice.status} />
          <Text style={styles.meta}>
            {invoice.amount}
            {invoice.due_date ? ` · Due ${formatDate(invoice.due_date)}` : ""}
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
  number: {
    fontWeight: "700",
    color: theme.colors.navy,
    fontSize: theme.typography.subtitle,
  },
  body: {
    marginVertical: 6,
    color: theme.colors.charcoal,
  },
  meta: {
    marginTop: 8,
    color: theme.colors.muted,
  },
});
