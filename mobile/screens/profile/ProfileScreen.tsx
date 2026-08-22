import { StyleSheet, Text } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import type { ProfileScreenProps } from "../../navigation/types";
import { useGetClientProfileQuery, useGetMeQuery } from "../../store/api";
import { signOut } from "../../store/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { theme } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export function ProfileScreen({ navigation }: ProfileScreenProps<"ProfileHome">) {
  const dispatch = useAppDispatch();
  const me = useGetMeQuery();
  const profile = useGetClientProfileQuery();

  return (
    <Screen
      refreshing={me.isFetching || profile.isFetching}
      onRefresh={() => {
        void me.refetch();
        void profile.refetch();
      }}
    >
      <Text style={styles.title}>Profile</Text>
      {me.isLoading || profile.isLoading ? <LoadingState /> : null}
      {me.isError ? <ErrorState message={getErrorMessage(me.error)} onRetry={() => void me.refetch()} /> : null}
      {profile.isError ? (
        <ErrorState message={getErrorMessage(profile.error)} onRetry={() => void profile.refetch()} />
      ) : null}
      {me.data ? (
        <Card>
          <Text style={styles.name}>{me.data.full_name}</Text>
          <Text style={styles.meta}>{me.data.email}</Text>
          <Text style={styles.meta}>{me.data.phone || "No phone on file"}</Text>
        </Card>
      ) : null}
      {profile.data ? (
        <Card>
          <Text style={styles.section}>Client profile</Text>
          <Text style={styles.body}>
            {profile.data.nationality} · {profile.data.current_country}
          </Text>
          <ProgressBar value={profile.data.completion_percent} label="Profile completeness" />
        </Card>
      ) : null}
      <Button title="Edit profile" onPress={() => navigation.navigate("EditProfile")} />
      <Button title="Change password" variant="secondary" onPress={() => navigation.navigate("ChangePassword")} />
      <Button title="Invoices" variant="secondary" onPress={() => navigation.navigate("Invoices")} />
      <Button title="Contact Mzansi" variant="secondary" onPress={() => navigation.navigate("Contact")} />
      <Button title="Sign out" variant="ghost" onPress={() => void dispatch(signOut())} />
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
    fontSize: theme.typography.subtitle,
    fontWeight: "700",
    color: theme.colors.navy,
  },
  meta: {
    color: theme.colors.muted,
    marginTop: 4,
  },
  section: {
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 6,
  },
  body: {
    color: theme.colors.charcoal,
    marginBottom: 10,
  },
});
