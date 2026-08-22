jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn(async () => false),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
