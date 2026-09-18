//
//  ReportExtension.swift
//  ReportExtension
//
//  Reads aggregate Screen Time via Apple's DeviceActivityReport API and
//  writes the total to App Group UserDefaults so the React Native app can
//  read it via `userDefaultsGet("totalScreenTimeSeconds")`.
//

import DeviceActivity
import SwiftUI

private let APP_GROUP_ID = "group.com.anonymous.raw-dawg-app"
private let TOTAL_SECONDS_KEY = "totalScreenTimeSeconds"
private let UPDATED_AT_KEY = "totalScreenTimeUpdatedAt"
private let EXT_INIT_KEY = "reportExtensionInitAt"
private let EXT_MAKE_CONFIG_KEY = "reportExtensionMakeConfigAt"
private let EXT_ERROR_KEY = "reportExtensionLastError"

extension DeviceActivityReport.Context {
  static let totalActivity = Self("DonothinTotalActivity")
}

@main
struct ReportApp: DeviceActivityReportExtension {
  init() {
    if let defaults = UserDefaults(suiteName: APP_GROUP_ID) {
      defaults.set(Date().timeIntervalSince1970, forKey: EXT_INIT_KEY)
    }
  }

  var body: some DeviceActivityReportScene {
    TotalActivityReport { _ in
      Color.clear
    }
  }
}

struct TotalActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (TimeInterval) -> Color

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TimeInterval {
    if let defaults = UserDefaults(suiteName: APP_GROUP_ID) {
      defaults.set(Date().timeIntervalSince1970, forKey: EXT_MAKE_CONFIG_KEY)
      defaults.removeObject(forKey: EXT_ERROR_KEY)
    }

    var totalSeconds: TimeInterval = 0
    for await activityData in data {
      for await activitySegment in activityData.activitySegments {
        totalSeconds += activitySegment.totalActivityDuration
      }
    }

    if let defaults = UserDefaults(suiteName: APP_GROUP_ID) {
      defaults.set(totalSeconds, forKey: TOTAL_SECONDS_KEY)
      defaults.set(Date().timeIntervalSince1970, forKey: UPDATED_AT_KEY)
    }

    return totalSeconds
  }
}
