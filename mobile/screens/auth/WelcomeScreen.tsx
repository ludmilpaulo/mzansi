import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { useGetHomeContentQuery } from "../../store/api";
import { theme } from "../../theme";
import type { AuthScreenProps } from "../../navigation/types";
import { parseBrandSettings } from "../../utils/envelope";

export function WelcomeScreen({ navigation }: AuthScreenProps<"Welcome">) {
  const home = useGetHomeContentQuery();
  const brand = home.data ? parseBrandSettings(home.data.settings.brand) : null;

  return (
    <View style={styles.wrap}>
      <StatusBar style="light" />
      <Text style={styles.eyebrow}>Client app</Text>
      <Text style={styles.title}>{brand?.name ?? "Mzansi Visa Solutions"}</Text>
      <Text style={styles.tagline}>
        {brand?.tagline || "Sign in to track applications, upload documents, and message your consultant."}
      </Text>
      <View style={styles.actions}>
        <Button title="Sign in" onPress={() => navigation.navigate("Login")} />
        <Button title="Create account" variant="secondary" onPress={() => navigation.navigate("Register")} />
      </View>
      <Text style={styles.disclaimer}>
        Professional immigration assistance. Outcomes are decided by the relevant authorities; this app does not
        guarantee visa approval.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.navy,
    padding: theme.spacing.lg,
    justifyContent: "flex-end",
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.white,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  tagline: {
    color: "#CBD5E1",
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  disclaimer: {
    color: "#94A3B8",
    fontSize: theme.typography.caption,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
});
