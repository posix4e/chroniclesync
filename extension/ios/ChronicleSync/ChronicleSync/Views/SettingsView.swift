//
//  SettingsView.swift
//  ChronicleSync
//
//  Created by OpenHands AI on 3/15/25.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var syncSettings: SyncSettings
    @Environment(\.presentationMode) var presentationMode
    @State private var apiEndpoint = "https://api.chroniclesync.xyz"
    @State private var syncFrequency = 60
    @State private var maxStorageSize = 100
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sync Settings")) {
                    Toggle("Enable Sync", isOn: $syncSettings.syncEnabled)
                    
                    Picker("Sync Frequency", selection: $syncFrequency) {
                        Text("Every minute").tag(1)
                        Text("Every 5 minutes").tag(5)
                        Text("Every 15 minutes").tag(15)
                        Text("Every 30 minutes").tag(30)
                        Text("Every hour").tag(60)
                    }
                    
                    Picker("Max Storage Size", selection: $maxStorageSize) {
                        Text("100 MB").tag(100)
                        Text("500 MB").tag(500)
                        Text("1 GB").tag(1000)
                        Text("5 GB").tag(5000)
                        Text("Unlimited").tag(0)
                    }
                }
                
                Section(header: Text("Server Settings")) {
                    TextField("API Endpoint", text: $apiEndpoint)
                }
                
                Section(header: Text("Account")) {
                    Button("Sign Out") {
                        // Sign out logic would go here
                    }
                    .foregroundColor(.red)
                }
                
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.gray)
                    }
                    
                    Button("Privacy Policy") {
                        // Open privacy policy
                    }
                    
                    Button("Terms of Service") {
                        // Open terms of service
                    }
                }
            }
            .navigationBarTitle("Settings", displayMode: .inline)
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(SyncSettings())
}