import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ApplicationDetailScreen } from "../screens/applications/ApplicationDetailScreen";
import { ApplicationsScreen } from "../screens/applications/ApplicationsScreen";
import { NewApplicationScreen } from "../screens/applications/NewApplicationScreen";
import { BookConsultationScreen } from "../screens/consultations/BookConsultationScreen";
import { DocumentsScreen } from "../screens/documents/DocumentsScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { InvoicesScreen } from "../screens/invoices/InvoicesScreen";
import { ConversationScreen } from "../screens/messages/ConversationScreen";
import { MessagesScreen } from "../screens/messages/MessagesScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { ChangePasswordScreen } from "../screens/profile/ChangePasswordScreen";
import { ContactScreen } from "../screens/profile/ContactScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { theme } from "../theme";
import type {
  AppTabParamList,
  ApplicationsStackParamList,
  DocumentsStackParamList,
  HomeStackParamList,
  MessagesStackParamList,
  ProfileStackParamList,
} from "./types";

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ApplicationsStack = createNativeStackNavigator<ApplicationsStackParamList>();
const DocumentsStack = createNativeStackNavigator<DocumentsStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackOptions = {
  headerTintColor: theme.colors.navy,
  headerTitleStyle: { fontWeight: "700" as const },
  contentStyle: { backgroundColor: theme.colors.background },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeHome" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <HomeStack.Screen name="BookConsultation" component={BookConsultationScreen} options={{ title: "Book consultation" }} />
      <HomeStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: "Application" }} />
    </HomeStack.Navigator>
  );
}

function ApplicationsStackNavigator() {
  return (
    <ApplicationsStack.Navigator screenOptions={stackOptions}>
      <ApplicationsStack.Screen name="ApplicationsList" component={ApplicationsScreen} options={{ title: "Applications" }} />
      <ApplicationsStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: "Application" }} />
      <ApplicationsStack.Screen name="NewApplication" component={NewApplicationScreen} options={{ title: "New application" }} />
    </ApplicationsStack.Navigator>
  );
}

function DocumentsStackNavigator() {
  return (
    <DocumentsStack.Navigator screenOptions={stackOptions}>
      <DocumentsStack.Screen name="DocumentsList" component={DocumentsScreen} options={{ title: "Documents" }} />
    </DocumentsStack.Navigator>
  );
}

function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={stackOptions}>
      <MessagesStack.Screen name="ConversationsList" component={MessagesScreen} options={{ title: "Messages" }} />
      <MessagesStack.Screen
        name="ConversationThread"
        component={ConversationScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </MessagesStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "Profile" }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit profile" }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change password" }} />
      <ProfileStack.Screen name="Contact" component={ContactScreen} options={{ title: "Contact" }} />
      <ProfileStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: "Invoices" }} />
    </ProfileStack.Navigator>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.white, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Applications: "folder-outline",
            Documents: "document-text-outline",
            Messages: "chatbubbles-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Applications" component={ApplicationsStackNavigator} />
      <Tab.Screen name="Documents" component={DocumentsStackNavigator} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
