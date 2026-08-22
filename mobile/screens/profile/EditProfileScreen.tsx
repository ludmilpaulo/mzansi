import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useGetClientProfileQuery, useGetMeQuery, useUpdateClientProfileMutation, useUpdateMeMutation } from "../../store/api";
import { setUser } from "../../store/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { theme } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const me = useGetMeQuery();
  const profile = useGetClientProfileQuery();
  const [updateMe, meState] = useUpdateMeMutation();
  const [updateProfile, profileState] = useUpdateClientProfileMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me.data) {
      setFirstName(me.data.first_name);
      setLastName(me.data.last_name);
      setPhone(me.data.phone);
    }
  }, [me.data]);

  useEffect(() => {
    if (profile.data) {
      setNationality(profile.data.nationality);
      setCurrentCountry(profile.data.current_country);
      setDateOfBirth(profile.data.date_of_birth ?? "");
      setPassportNumber(profile.data.passport_number);
      setAddress(profile.data.residential_address);
      setCity(profile.data.city);
    }
  }, [profile.data]);

  async function onSave() {
    setSaved(false);
    try {
      const user = await updateMe({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() }).unwrap();
      dispatch(setUser(user));
      await updateProfile({
        nationality: nationality.trim(),
        current_country: currentCountry.trim(),
        date_of_birth: dateOfBirth.trim() || null,
        passport_number: passportNumber.trim(),
        residential_address: address.trim(),
        city: city.trim(),
      }).unwrap();
      setSaved(true);
    } catch {
      // Shown below.
    }
  }

  if (me.isLoading || profile.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (me.isError) {
    return (
      <Screen>
        <ErrorState message={getErrorMessage(me.error)} onRetry={() => void me.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Edit profile</Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Nationality" value={nationality} onChangeText={setNationality} />
      <TextField label="Current country" value={currentCountry} onChangeText={setCurrentCountry} />
      <TextField label="Date of birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />
      <TextField label="Passport number" value={passportNumber} onChangeText={setPassportNumber} autoCapitalize="characters" />
      <TextField label="Residential address" value={address} onChangeText={setAddress} multiline />
      <TextField label="City" value={city} onChangeText={setCity} />
      {meState.isError ? <Text style={styles.error}>{getErrorMessage(meState.error)}</Text> : null}
      {profileState.isError ? <Text style={styles.error}>{getErrorMessage(profileState.error)}</Text> : null}
      {saved ? <Text style={styles.success}>Profile updated.</Text> : null}
      <Button title="Save" onPress={() => void onSave()} loading={meState.isLoading || profileState.isLoading} />
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
