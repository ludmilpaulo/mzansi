import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useChangePasswordMutation } from "../../store/api";
import { theme } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassword, request] = useChangePasswordMutation();

  return (
    <Screen>
      <Text style={styles.title}>Change password</Text>
      <TextField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
      <TextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
      {request.isError ? <Text style={styles.error}>{getErrorMessage(request.error)}</Text> : null}
      {request.isSuccess ? <Text style={styles.success}>{request.data.detail}</Text> : null}
      <Button
        title="Update password"
        onPress={() => void changePassword({ current_password: currentPassword, new_password: newPassword })}
        loading={request.isLoading}
        disabled={!currentPassword || newPassword.length < 10}
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
  error: {
    color: theme.colors.danger,
  },
  success: {
    color: theme.colors.success,
  },
});
