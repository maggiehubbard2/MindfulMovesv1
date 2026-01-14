//
//  WidgetDataModule.swift
//  MindfulMoves
//
//  Native module to write widget data to App Group UserDefaults
//  This allows the widget extension to read the data
//

import Foundation
import React

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func writeWidgetData(_ data: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Write to App Group UserDefaults (shared with widget extension)
    if let sharedDefaults = UserDefaults(suiteName: "group.com.mindfulmoves.app") {
      // Convert JSON string to Data
      if let jsonData = data.data(using: .utf8) {
        sharedDefaults.set(jsonData, forKey: "widget_habits")
        sharedDefaults.synchronize()
        resolver(true)
      } else {
        rejecter("ENCODING_ERROR", "Failed to encode widget data", nil)
      }
    } else {
      rejecter("APP_GROUP_ERROR", "App Group not configured", nil)
    }
  }
}

