import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { User } from './auth.types';

export type AuthStackParamList = {
  Welcome: undefined;
  SignUpName: undefined;
  SignUpEmail: undefined;
  SignUpPassword: undefined;
  SignUpLocation: { fromGoogle?: boolean; user?: User; token?: string } | undefined;
  Login: undefined;
  Phone: {
    email: string;
    password?: string;
    user?: User;
    token?: string;
    fromGoogle?: boolean;
    needsLocation?: boolean;
  };
  Otp: {
    email: string;
    password?: string;
    phone: string;
    user?: User;
    token?: string;
    fromGoogle?: boolean;
    needsLocation?: boolean;
  };
  ForgotPasswordPhone: undefined;
  ForgotPasswordOtp: { phone: string };
  ForgotPasswordReset: { phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  ForgotPasswordPhone: undefined;
  ForgotPasswordOtp: { phone: string };
  ForgotPasswordReset: { phone: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        MainStackParamList,
        MainTabParamList {}
  }
}
