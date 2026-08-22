import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { AuthScreenProps } from "../../navigation/types";
import { useConfirmPasswordResetMutation, useRequestPasswordResetMutation } from "../../store/api";
import { theme } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<"ForgotPassword">) {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requestReset, requestState] = useRequestPasswordResetMutation();
  const [confirmReset, confirmState] = useConfirmPasswordResetMutation();

  return (
    <Screen>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>
        Enter your email. If an account exists, reset instructions are sent. Use the uid and token from that message to
        set a new password.
      </Text>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Button
        title="Send reset instructions"
        onPress={() => void requestReset({ email: email.trim() })}
        loading={requestState.isLoading}
        disabled={!email.trim()}
      />
      {requestState.isSuccess ? <Text style={styles.success}>{requestState.data.detail}</Text> : null}
      {requestState.isError ? <Text style={styles.error}>{getErrorMessage(requestState.error)}</Text> : null}

      <Text style={styles.section}>Have a reset token?</Text>
      <TextField label="UID" value={uid} onChangeText={setUid} autoCapitalize="none" />
      <TextField label="Token" value={token} onChangeText={setToken} autoCapitalize="none" />
      <TextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
      <Button
        title="Set new password"
        onPress={() => void confirmReset({ uid: uid.trim(), token: token.trim(), new_password: newPassword })}
        loading={confirmState.isLoading}
        disabled={!uid.trim() || !token.trim() || newPassword.length < 10}
      />
      {confirmState.isSuccess ? <Text style={styles.success}>{confirmState.data.detail}</Text> : null}
      {confirmState.isError ? <Text style={styles.error}>{getErrorMessage(confirmState.error)}</Text> : null}
      <Button title="Back to sign in" variant="ghost" onPress={() => navigation.navigate("Login")} />
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
    marginTop: theme.spacing.sm,
    fontWeight: "700",
    color: theme.colors.navy,
  },
  success: {
    color: theme.colors.success,
  },
  error: {
    color: theme.colors.danger,
  },
});
