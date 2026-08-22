import { authInitialState, authReducer, clearSession, setCredentials, setUser } from "../store/authSlice";
import type { User } from "../types/api";

const sampleUser: User = {
  id: 1,
  email: "client@example.com",
  first_name: "Ada",
  last_name: "Client",
  full_name: "Ada Client",
  phone: "+27000000000",
  role: "CLIENT",
  preferred_language: "en",
  is_email_verified: true,
  is_staff_role: false,
};

describe("authReducer", () => {
  it("stores credentials and user", () => {
    const next = authReducer(
      authInitialState,
      setCredentials({ access: "access-token", refresh: "refresh-token", user: sampleUser }),
    );
    expect(next.access).toBe("access-token");
    expect(next.refresh).toBe("refresh-token");
    expect(next.user?.email).toBe("client@example.com");
  });

  it("updates the signed-in user", () => {
    const withSession = authReducer(
      authInitialState,
      setCredentials({ access: "a", refresh: "r", user: sampleUser }),
    );
    const next = authReducer(withSession, setUser({ ...sampleUser, first_name: "Updated" }));
    expect(next.user?.first_name).toBe("Updated");
  });

  it("clears the session", () => {
    const withSession = authReducer(
      authInitialState,
      setCredentials({ access: "a", refresh: "r", user: sampleUser }),
    );
    const next = authReducer(withSession, clearSession());
    expect(next.access).toBeNull();
    expect(next.refresh).toBeNull();
    expect(next.user).toBeNull();
  });
});
