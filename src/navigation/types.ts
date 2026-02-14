import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Bottom Tab Navigator ─────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Rewire: undefined;
  Settings: undefined;
};

// ─── Root Stack Navigator ─────────────────────────────────
// Session flow screens live here, outside the tab navigator,
// so the tab bar is hidden during the session.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Prepare: undefined;
  Timer: undefined;
  Selfie: undefined;
  Results: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
