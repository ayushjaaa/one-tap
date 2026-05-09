import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, User, type LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ForgotPasswordPhoneScreen } from '@/screens/auth/ForgotPasswordPhoneScreen';
import { ForgotPasswordOtpScreen } from '@/screens/auth/ForgotPasswordOtpScreen';
import { ForgotPasswordResetScreen } from '@/screens/auth/ForgotPasswordResetScreen';
import { colors, typography } from '@/theme';
import type {
  MainStackParamList,
  MainTabParamList,
} from '@/types/navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

interface TabIconProps {
  focused: boolean;
  Icon: LucideIcon;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, Icon, label }) => {
  return (
    <View style={styles.tabItem}>
      <Icon
        size={22}
        color={focused ? colors.primary : colors.textMuted}
        strokeWidth={focused ? 2.5 : 2}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

const HomeTabIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} Icon={Home} label="Home" />
);

const ProfileTabIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} Icon={User} label="Profile" />
);

const TabsNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: HomeTabIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ProfileTabIcon }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen
        name="ForgotPasswordPhone"
        component={ForgotPasswordPhoneScreen}
      />
      <Stack.Screen
        name="ForgotPasswordOtp"
        component={ForgotPasswordOtpScreen}
      />
      <Stack.Screen
        name="ForgotPasswordReset"
        component={ForgotPasswordResetScreen}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
