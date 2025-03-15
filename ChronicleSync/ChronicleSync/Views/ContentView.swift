import SwiftUI
import SafariServices

struct ContentView: View {
    @EnvironmentObject var syncSettings: SyncSettings
    @State private var isExtensionEnabled = false
    @State private var showingSettings = false
    @State private var showingHistory = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack {
                    Image(systemName: "globe")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100)
                        .padding()
                    
                    Text("ChronicleSync")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Sync your browsing history across devices")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                Spacer()
                
                // Status Card
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Circle()
                            .fill(syncSettings.isOnline ? Color.green : Color.red)
                            .frame(width: 12, height: 12)
                        
                        Text(syncSettings.isOnline ? "Online" : "Offline")
                            .font(.headline)
                        
                        Spacer()
                        
                        Text("Last sync: \(syncSettings.lastSyncFormatted)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    HStack {
                        Text("Sync enabled:")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Toggle("", isOn: $syncSettings.syncEnabled)
                            .labelsHidden()
                    }
                    
                    HStack {
                        Text("Items pending:")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text("\(syncSettings.pendingItems)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(15)
                .padding(.horizontal)
                
                // Safari Extension Card
                VStack(alignment: .leading, spacing: 10) {
                    Text("Safari Extension")
                        .font(.headline)
                    
                    Text("Enable the Safari extension to start syncing your browsing history.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Button(action: {
                        openSafariExtensionPreferences()
                    }) {
                        Text("Enable Safari Extension")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    .padding(.top, 5)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(15)
                .padding(.horizontal)
                
                Spacer()
                
                // Bottom Buttons
                HStack(spacing: 20) {
                    Button(action: {
                        showingHistory = true
                    }) {
                        VStack {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 24))
                            Text("History")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        syncSettings.syncNow()
                    }) {
                        VStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 24))
                            Text("Sync Now")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        showingSettings = true
                    }) {
                        VStack {
                            Image(systemName: "gear")
                                .font(.system(size: 24))
                            Text("Settings")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                    }
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationBarTitle("", displayMode: .inline)
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showingHistory) {
                SyncHistoryView()
            }
        }
        .onAppear {
            checkExtensionStatus()
        }
    }
    
    func openSafariExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(
            withIdentifier: "com.chroniclesync.ChronicleSync.Extension") { error in
            if let error = error {
                print("Error opening Safari extension preferences: \(error)")
            }
        }
    }
    
    func checkExtensionStatus() {
        // In a real app, you would implement a way to check if the extension is enabled
        // This is just a placeholder
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isExtensionEnabled = UserDefaults.standard.bool(forKey: "extensionEnabled")
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(SyncSettings())
    }
}