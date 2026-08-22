import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import type { AuthScreenProps } from "../../navigation/types";
import { useRegisterMutation } from "../../store/api";
import { persistSession } from "../../store/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { theme } from "../../theme";
import { getErrorMessage, getFieldError } from "../../utils/errors";

export function RegisterScreen({ navigation }: AuthScreenProps<"Register">) {
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [register, request] = useRegisterMutation();

  async function onSubmit() {
    try {
      const data = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country_of_nationality: nationality.trim(),
        current_country: currentCountry.trim(),
        date_of_birth: dateOfBirth.trim() || null,
        passport_number: passportNumber.trim(),
        preferred_language: "en",
        password,
        password_confirm: passwordConfirm,
      }).unwrap();
      await dispatch(
        persistSession({
          access: data.tokens.access,
          refresh: data.tokens.refresh,
          user: data.user,
        }),
      ).unwrap();
    } catch {
      // Rendered below.
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>We’ll open a client profile. An application is created only after you choose a service.</Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} error={getFieldError(request.error, "first_name")} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} error={getFieldError(request.error, "last_name")} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={getFieldError(request.error, "email")}
      />
      <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={getFieldError(request.error, "phone")} />
      <TextField
        label="Country of nationality"
        value={nationality}
        onChangeText={setNationality}
        error={getFieldError(request.error, "country_of_nationality")}
      />
      <TextField
        label="Current country"
        value={currentCountry}
        onChangeText={setCurrentCountry}
        error={getFieldError(request.error, "current_country")}
      />
      <TextField
        label="Date of birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="Optional"
        error={getFieldError(request.error, "date_of_birth")}
      />
      <TextField
        label="Passport number"
        value={passportNumber}
        onChangeText={setPassportNumber}
        placeholder="Optional"
        autoCapitalize="characters"
        error={getFieldError(request.error, "passport_number")}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        error={getFieldError(request.error, "password")}
      />
      <TextField
        label="Confirm password"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        autoCapitalize="none"
        error={getFieldError(request.error, "password_confirm")}
      />
      {request.isError ? <Text style={styles.error}>{getErrorMessage(request.error)}</Text> : null}
      <Button title="Create account" onPress={() => void onSubmit()} loading={request.isLoading} />
      <Button title="I already have an account" variant="ghost" onPress={() => navigation.navigate("Login")} />
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
  error: {
    color: theme.colors.danger,
  },
});
