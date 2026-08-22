import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { TextField } from "../../components/TextField";
import type { MessagesScreenProps } from "../../navigation/types";
import { useGetMessagesQuery, useSendMessageMutation } from "../../store/api";
import { useAppSelector } from "../../store/hooks";
import { theme } from "../../theme";
import { formatDateTime } from "../../utils/dates";
import { getErrorMessage } from "../../utils/errors";

export function ConversationScreen({ route }: MessagesScreenProps<"ConversationThread">) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const query = useGetMessagesQuery(route.params.id);
  const [sendMessage, sendState] = useSendMessageMutation();
  const [body, setBody] = useState("");

  async function onSend() {
    const text = body.trim();
    if (!text) {
      return;
    }
    try {
      await sendMessage({ id: route.params.id, body: { body: text } }).unwrap();
      setBody("");
    } catch {
      // Shown below.
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = item.sender === userId;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.sender, mine && styles.mineText]}>{item.sender_name || "System"}</Text>
              <Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text>
              <Text style={[styles.meta, mine && styles.mineText]}>{formatDateTime(item.created_at)}</Text>
            </View>
          );
        }}
      />
      {sendState.isError ? <Text style={styles.error}>{getErrorMessage(sendState.error)}</Text> : null}
      <View style={styles.composer}>
        <View style={styles.flex}>
          <TextField label="Message" value={body} onChangeText={setBody} multiline />
        </View>
        <Button title="Send" onPress={() => void onSend()} loading={sendState.isLoading} disabled={!body.trim()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.navy,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sender: {
    fontWeight: "700",
    color: theme.colors.navy,
    marginBottom: 4,
  },
  body: {
    color: theme.colors.charcoal,
    lineHeight: 20,
  },
  meta: {
    marginTop: 6,
    color: theme.colors.muted,
    fontSize: 11,
  },
  mineText: {
    color: theme.colors.white,
  },
  composer: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  flex: {
    flexGrow: 1,
  },
  error: {
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
  },
});
