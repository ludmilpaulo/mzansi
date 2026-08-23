import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  HomeHome: undefined;
  Notifications: undefined;
  BookConsultation: undefined;
  ApplicationDetail: { id: number };
  ApplicationTracking: { id: number };
};

export type ApplicationsStackParamList = {
  ApplicationsList: undefined;
  ApplicationDetail: { id: number };
  ApplicationTracking: { id: number };
  NewApplication: undefined;
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
};

export type MessagesStackParamList = {
  ConversationsList: undefined;
  ConversationThread: { id: number; title: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Contact: undefined;
  Invoices: undefined;
};

export type AppTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Applications: NavigatorScreenParams<ApplicationsStackParamList>;
  Documents: NavigatorScreenParams<DocumentsStackParamList>;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<AppTabParamList>
>;
export type ApplicationsScreenProps<T extends keyof ApplicationsStackParamList> = NativeStackScreenProps<
  ApplicationsStackParamList,
  T
>;
export type MessagesScreenProps<T extends keyof MessagesStackParamList> = NativeStackScreenProps<
  MessagesStackParamList,
  T
>;
export type ProfileScreenProps<T extends keyof ProfileStackParamList> = NativeStackScreenProps<ProfileStackParamList, T>;

declare global {
  // React Navigation typed `useNavigation()` hook.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
