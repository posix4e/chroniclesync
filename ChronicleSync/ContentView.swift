import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var showSettings = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "globe")
                    .imageScale(.large)
                    .foregroundColor(.accentColor)
                
                Text("ChronicleSync")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Safari Extension")
                    .font(.title2)
                
                Spacer().frame(height: 20)
                
                VStack(alignment: .leading, spacing: 10) {
                    Text("To enable the ChronicleSync extension:")
                        .font(.headline)
                    
                    Text("1. Open Safari Settings")
                    Text("2. Go to Extensions")
                    Text("3. Enable ChronicleSync")
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                
                Spacer()
                
                Button("Open Settings") {
                    showSettings = true
                }
                .buttonStyle(.borderedProminent)
                .padding()
            }
            .padding()
            .navigationTitle("ChronicleSync")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showSettings = true
                    }) {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
}

#Preview {
    ContentView()
}