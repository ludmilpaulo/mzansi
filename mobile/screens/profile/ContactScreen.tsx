import { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useCreateInquiryMutation, useGetHomeContentQuery } from "../../store/api";
import { theme } from "../../theme";
import { parseBrandSettings } from "../../utils/envelope";
import { getErrorMessage } from "../../utils/errors";

export function ContactScreen() {
  const home = useGetHomeContentQuery();
  const [createInquiry, inquiryState] = useCreateInquiryMutation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const brand = home.data ? parseBrandSettings(home.data.settings.brand) : null;

  return (
    <Screen refreshing={home.isFetching} onRefresh={() => void home.refetch()}>
      <Text style={styles.title}>Contact Mzansi</Text>
      {home.isLoading ? <LoadingState /> : null}
      {home.isError ? <ErrorState message={getErrorMessage(home.error)} onRetry={() => void home.refetch()} /> : null}
      {brand ? (
        <Card>
          <Text style={styles.name}>{brand.name}</Text>
          {brand.tagline ? <Text style={styles.body}>{brand.tagline}</Text> : null}
          {brand.phone ? <Text style={styles.meta}>{brand.phone}</Text> : null}
          {brand.email ? <Text style={styles.meta}>{brand.email}</Text> : null}
          {brand.address ? <Text style={styles.meta}>{brand.address}</Text> : null}
          {brand.phone ? (
            <Button title="Call" variant="secondary" onPress={() => void Linking.openURL(`tel:${brand.phone}`)} />
          ) : null}
          {brand.email ? (
            <Button title="Email" variant="ghost" onPress={() => void Linking.openURL(`mailto:${brand.email}`)} />
          ) : null}
        </Card>
      ) : null}
      <Text style={styles.section}>Send a message</Text>
      <TextField label="Subject" value={subject} onChangeText={setSubject} />
      <TextField label="Message" value={message} onChangeText={setMessage} multiline />
      {inquiryState.isError ? <Text style={styles.error}>{getErrorMessage(inquiryState.error)}</Text> : null}
      {inquiryState.isSuccess ? <Text style={styles.success}>Message sent. The support team will reply in the portal.</Text> : null}
      <Button
        title="Send inquiry"
        onPress={() =>
          void createInquiry({
            subject: subject.trim(),
            message: message.trim(),
            category: "GENERAL",
          })
        }
        loading={inquiryState.isLoading}
        disabled={!subject.trim() || !message.trim()}
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
  name: {
    fontWeight: "700",
    fontSize: theme.typography.subtitle,
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
  section: {
    fontWeight: "700",
    color: theme.colors.navy,
  },
  error: {
    color: theme.colors.danger,
  },
  success: {
    color: theme.colors.success,
  },
});
