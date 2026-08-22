import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { HomeScreenProps } from "../../navigation/types";
import {
  useCreateAppointmentMutation,
  useGetAppointmentSlotsQuery,
  useGetConsultationTypesQuery,
  useGetDashboardQuery,
} from "../../store/api";
import { theme } from "../../theme";
import { formatDate, formatDateTime, toDateParam, upcomingDates } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function BookConsultationScreen({ navigation }: HomeScreenProps<"BookConsultation">) {
  const types = useGetConsultationTypesQuery();
  const dashboard = useGetDashboardQuery();
  const [typeId, setTypeId] = useState<number | null>(null);
  const [date, setDate] = useState(toDateParam(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [createAppointment, createState] = useCreateAppointmentMutation();

  const consultantId = dashboard.data?.active_application?.assigned_consultant ?? null;
  const consultantName = dashboard.data?.active_application?.consultant_name ?? null;
  const dates = useMemo(() => upcomingDates(14), []);

  const slots = useGetAppointmentSlotsQuery(
    consultantId && typeId
      ? { consultant_id: consultantId, date, consultation_type_id: typeId }
      : { consultant_id: 0, date },
    { skip: !consultantId || !typeId },
  );

  async function onBook() {
    if (!consultantId || !typeId || !slot) {
      return;
    }
    try {
      await createAppointment({
        consultation_type_id: typeId,
        consultant_id: consultantId,
        starts_at: slot,
        client_notes: notes.trim() || undefined,
      }).unwrap();
      navigation.goBack();
    } catch {
      // Rendered below.
    }
  }

  return (
    <Screen
      refreshing={types.isFetching}
      onRefresh={() => {
        void types.refetch();
        void dashboard.refetch();
        if (!slots.isUninitialized) {
          void slots.refetch();
        }
      }}
    >
      <Text style={styles.title}>Book a consultation</Text>
      <Text style={styles.subtitle}>
        Times come from your assigned consultant’s availability. A booking is a discussion, not a guarantee of any
        outcome.
      </Text>

      {types.isLoading || dashboard.isLoading ? <LoadingState /> : null}
      {types.isError ? <ErrorState message={getErrorMessage(types.error)} onRetry={() => void types.refetch()} /> : null}

      {!consultantId && dashboard.data ? (
        <EmptyState
          title="No consultant assigned"
          message="Booking needs the consultant on your active application. Contact Mzansi if you need an appointment before a file is opened."
          actionLabel="Contact Mzansi"
          onAction={() => navigation.navigate("Profile", { screen: "Contact" })}
        />
      ) : null}

      {consultantName ? <Text style={styles.meta}>Consultant: {consultantName}</Text> : null}

      <Text style={styles.section}>Consultation type</Text>
      {types.data?.map((item) => (
        <Card key={item.id} onPress={() => setTypeId(item.id)}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.body}>{item.description}</Text>
          <Text style={styles.meta}>
            {item.duration_minutes} min · {item.price}
          </Text>
          {typeId === item.id ? <Text style={styles.selected}>Selected</Text> : null}
        </Card>
      ))}

      <Text style={styles.section}>Date</Text>
      <View style={styles.chips}>
        {dates.map((item) => {
          const value = toDateParam(item);
          return (
            <Pressable key={value} onPress={() => setDate(value)} style={[styles.chip, date === value && styles.chipActive]}>
              <Text style={[styles.chipLabel, date === value && styles.chipLabelActive]}>{formatDate(item.toISOString())}</Text>
            </Pressable>
          );
        })}
      </View>

      {slots.isFetching ? <LoadingState message="Loading times…" /> : null}
      {slots.isError ? <ErrorState message={getErrorMessage(slots.error)} onRetry={() => void slots.refetch()} /> : null}
      {slots.data && slots.data.length === 0 ? (
        <EmptyState title="No times on this date" message="Choose another date." />
      ) : null}
      {slots.data?.map((item) => (
        <Card key={item.starts_at} onPress={() => setSlot(item.starts_at)}>
          <Text style={styles.name}>{formatDateTime(item.starts_at)}</Text>
          {slot === item.starts_at ? <Text style={styles.selected}>Selected</Text> : null}
        </Card>
      ))}

      <TextField label="Notes for the consultant" value={notes} onChangeText={setNotes} multiline />
      {createState.isError ? <Text style={styles.error}>{getErrorMessage(createState.error)}</Text> : null}
      <Button
        title="Confirm booking"
        onPress={() => void onBook()}
        loading={createState.isLoading}
        disabled={!consultantId || !typeId || !slot}
      />
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
  section: {
    fontWeight: "700",
    color: theme.colors.navy,
    marginTop: 8,
  },
  name: {
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  body: {
    color: theme.colors.charcoal,
    marginTop: 4,
  },
  meta: {
    color: theme.colors.muted,
    marginTop: 4,
  },
  selected: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.white,
  },
  chipActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  chipLabel: {
    color: theme.colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: theme.colors.white,
  },
  error: {
    color: theme.colors.danger,
  },
});
