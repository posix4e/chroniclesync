import SwiftUI

struct SettingsView: View {
    @AppStorage("apiEndpoint") private var apiEndpoint = "https://api.chroniclesync.xyz"
    @AppStorage("syncEnabled") private var syncEnabled = true
    @AppStorage("syncInterval") private var syncInterval = 60.0
    @AppStorage("maxHistoryItems") private var maxHistoryItems = 1000
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Sync Settings")) {
                    Toggle("Enable Sync", isOn: $syncEnabled)
                    
                    VStack(alignment: .leading) {
                        Text("Sync Interval (seconds)")
                        Slider(value: $syncInterval, in: 30...300, step: 30) {
                            Text("Sync Interval")
                        }
                        Text("\(Int(syncInterval)) seconds")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Stepper("Max History Items: \(maxHistoryItems)", value: $maxHistoryItems, in: 100...10000, step: 100)
                }
                
                Section(header: Text("API Settings")) {
                    TextField("API Endpoint", text: $apiEndpoint)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
                
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarItems(trailing: Button("Done") {
                dismiss()
            })
        }
    }
}

#Preview {
    SettingsView()
}