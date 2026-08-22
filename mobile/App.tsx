import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";

import { RootNavigator } from "./navigation/RootNavigator";
import { useGetMeQuery } from "./store/api";
import { hydrateAuth, setUser } from "./store/authSlice";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { store } from "./store";
import { theme } from "./theme";

function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const access = useAppSelector((state) => state.auth.access);

  useEffect(() => {
    void dispatch(hydrateAuth());
  }, [dispatch]);

  const me = useGetMeQuery(undefined, { skip: !access });

  useEffect(() => {
    if (me.data) {
      dispatch(setUser(me.data));
    }
  }, [dispatch, me.data]);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <Provider store={store}>
        <SessionBootstrap />
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
