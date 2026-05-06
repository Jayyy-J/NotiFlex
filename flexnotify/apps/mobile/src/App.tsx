import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { HomeScreen } from './screens/dashboard/HomeScreen';
import { NotificationsScreen } from './screens/dashboard/NotificationsScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { BillingScreen } from './screens/settings/BillingScreen';

// Hooks & store
import { useAuthStore } from './hooks/useAuth';

// FCM setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { borderTopWidth: 1, paddingBottom: 8, paddingTop: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Blocks', tabBarIcon: ({ color }) => <TabIcon name="📦" color={color} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts', tabBarIcon: ({ color }) => <TabIcon name="🔔" color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} /> }} />
      <Tab.Screen name="Billing" component={BillingScreen} options={{ tabBarLabel: 'Billing', tabBarIcon: ({ color }) => <TabIcon name="💳" color={color} /> }} />
    </Tab.Navigator>
  );
}

function TabIcon({ name }: { name: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{name}</Text>;
}

export default function App() {
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
