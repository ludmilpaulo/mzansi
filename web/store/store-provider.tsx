"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { api } from "@/store/api";
import { hydrateAuth, setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { makeStore, type AppStore } from "@/store/index";

function AuthHydrator({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const access = useAppSelector((state) => state.auth.access);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  useEffect(() => {
    void dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated || !access) {
      return;
    }
    const request = dispatch(api.endpoints.getMe.initiate());
    void request.then((result) => {
      if ("data" in result && result.data) {
        dispatch(setUser(result.data));
      }
    });
    return () => {
      request.unsubscribe();
    };
  }, [access, dispatch, hydrated]);

  return children;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}

export { AuthHydrator as AuthProvider };
