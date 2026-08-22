import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { AuthScreenProps } from "../../navigation/types";
import { useLoginMutation } from "../../store/api";
import { persistSession } from "../../store/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { theme } from "../../theme";
import { getErrorMessage, getFieldError } from "../../utils/errors";

export function LoginScreen({ navigation }: AuthScreenProps<"Login">) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, request] = useLoginMutation();

  async function onSubmit() {
    try {
      const data = await login({ email: email.trim(), password }).unwrap();
      await dispatch(persistSession({ access: data.access, refresh: data.refresh, user: data.user })).unwrap();
    } catch {
      // Error banner is rendered from request.error.
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Use the email and password for your client account.</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={getFieldError(request.error, "email")}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        error={getFieldError(request.error, "password")}
      />
      {request.isError ? <Text style={styles.error}>{getErrorMessage(request.error)}</Text> : null}
      <Button title="Sign in" onPress={() => void onSubmit()} loading={request.isLoading} disabled={!email || !password} />
      <Button title="Forgot password" variant="ghost" onPress={() => navigation.navigate("ForgotPassword")} />
      <Button title="Create an account" variant="secondary" onPress={() => navigation.navigate("Register")} />
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
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
  },
});
