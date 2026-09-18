import React, { useEffect, useState } from 'react';
import { View, StyleSheet, InteractionManager } from 'react-native';

// Lazy-resolve the native view manager on first render rather than at module
// load. `requireNativeViewManager` from expo-modules-core throws synchronously
// if the native module isn't registered, which would crash any module that
// imports this file at boot. Defer + try/catch so missing-extension cases
// degrade gracefully to "no mount → poll times out → manual entry fallback".
let NativeReportView: React.ComponentType<{ contextName: string; days: number; style?: any }> | null = null;
function resolveNativeView() {
  if (NativeReportView) return NativeReportView;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeViewManager } = require('expo-modules-core');
    NativeReportView = requireNativeViewManager('ReactNativeDeviceActivityReportViewModule');
    return NativeReportView;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[ScreenTime] DeviceActivityReportView manager not found:', (e as any)?.message || e);
    return null;
  }
}

let userDefaultsGet: <T = unknown>(key: string) => T | undefined = () => undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  userDefaultsGet = require('react-native-device-activity').userDefaultsGet;
} catch {}

interface Props {
  /** How many days of history to aggregate. Default 7. */
  days?: number;
  /** Polling interval in ms. */
  pollIntervalMs?: number;
  /** Total polling timeout in ms. */
  timeoutMs?: number;
  /** Fired with total daily-average hours once the extension persists data. */
  onResult: (dailyHours: number, totalSeconds: number) => void;
  /** Fired if the extension never produces data within timeoutMs. */
  onTimeout?: () => void;
}

const TOTAL_KEY = 'totalScreenTimeSeconds';
const UPDATED_KEY = 'totalScreenTimeUpdatedAt';
const VIEW_REBUILD_KEY = 'reportViewRebuildAt';
const EXT_INIT_KEY = 'reportExtensionInitAt';
const EXT_MAKE_CONFIG_KEY = 'reportExtensionMakeConfigAt';
const EXT_ERROR_KEY = 'reportExtensionLastError';

// Render the SwiftUI DeviceActivityReport offscreen, then poll App Group
// UserDefaults until our extension writes a fresh number. Resolves to the
// user's daily-average hours.
export function ScreenTimeReader({
  days = 7,
  pollIntervalMs = 250,
  timeoutMs = 12000,
  onResult,
  onTimeout,
}: Props) {
  const [mountedAt] = useState(() => Date.now() / 1000);
  // Defer mounting the SwiftUI host past Fabric commit. Mounting inline
  // crashes the shadow tree on iOS 26 + new architecture; deferring via
  // InteractionManager lets the SwiftUI host attach on an idle frame.
  const [shouldMountNative, setShouldMountNative] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setShouldMountNative(true), 50);
    });
    return () => { (handle as any)?.cancel?.(); };
  }, []);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      try {
        const updatedAt = userDefaultsGet<number>(UPDATED_KEY);
        const seconds = userDefaultsGet<number>(TOTAL_KEY);
        if (updatedAt && updatedAt > mountedAt && typeof seconds === 'number') {
          clearInterval(interval);
          const dailyHours = seconds / 3600 / Math.max(1, days);
          onResult(dailyHours, seconds);
        }
      } catch {}
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        try {
          const viewRebuiltAt = userDefaultsGet<number>(VIEW_REBUILD_KEY);
          const extInitAt = userDefaultsGet<number>(EXT_INIT_KEY);
          const extMakeConfigAt = userDefaultsGet<number>(EXT_MAKE_CONFIG_KEY);
          const extErr = userDefaultsGet<string>(EXT_ERROR_KEY);
          // eslint-disable-next-line no-console
          console.log('[ScreenTime] timeout diag:', {
            mountedAt,
            viewRebuiltAt,
            extInitAt,
            extMakeConfigAt,
            extErr,
            viewMountedAfter: viewRebuiltAt && viewRebuiltAt > mountedAt,
            extInitedAfter: extInitAt && extInitAt > mountedAt,
            extConfigAfter: extMakeConfigAt && extMakeConfigAt > mountedAt,
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('[ScreenTime] diag read failed:', e);
        }
        onTimeout?.();
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [days, mountedAt, onResult, onTimeout, pollIntervalMs, timeoutMs]);

  if (!shouldMountNative) return null;
  const Native = resolveNativeView();
  if (!Native) return null; // No native view → poller will time out → manual entry.

  return (
    <View style={st.host} pointerEvents="none">
      {/* Must match the Swift extension's `DeviceActivityReport.Context`
          declaration in `targets/ReportExtension/ReportExtension.swift`. If
          this string doesn't match, iOS silently fails to launch the
          extension (no error, no init log — just a 12s timeout). */}
      <Native contextName="DonothinTotalActivity" days={days} style={StyleSheet.absoluteFillObject} />
    </View>
  );
}

const st = StyleSheet.create({
  // Full-screen but visually invisible (the SwiftUI report body returns
  // Color.clear, so it draws nothing). Kept on-screen with a real frame
  // because iOS only launches the report extension for an active host.
  host: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.001,
  },
});
