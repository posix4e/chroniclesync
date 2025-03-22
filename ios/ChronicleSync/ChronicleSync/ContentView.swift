import SwiftUI

struct ContentView: View {
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "globe")
                    .imageScale(.large)
                    .foregroundColor(.accentColor)
                
                Text("ChronicleSync")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Safari Web Extension")
                    .font(.title2)
                
                Spacer().frame(height: 20)
                
                VStack(alignment: .leading, spacing: 15) {
                    HowToEnableView(
                        step: "1",
                        title: "Open Safari Settings",
                        description: "Go to Settings > Safari > Extensions"
                    )
                    
                    HowToEnableView(
                        step: "2",
                        title: "Enable ChronicleSync",
                        description: "Toggle on ChronicleSync and set permissions"
                    )
                    
                    HowToEnableView(
                        step: "3",
                        title: "Start Browsing",
                        description: "ChronicleSync will now track your browsing history"
                    )
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemGray6))
                )
                .padding(.horizontal)
                
                Spacer()
                
                Button(action: {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text("Open Safari Settings")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationBarTitle("", displayMode: .inline)
            .navigationBarItems(trailing: Button(action: {
                showingSettings = true
            }) {
                Image(systemName: "gear")
            })
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
        }
    }
}

struct HowToEnableView: View {
    let step: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            Text(step)
                .font(.headline)
                .padding(10)
                .background(Circle().fill(Color.accentColor))
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct SettingsView: View {
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://chroniclesync.xyz")!) {
                        HStack {
                            Text("Website")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundColor(.accentColor)
                        }
                    }
                }
                
                Section(header: Text("Support")) {
                    Link(destination: URL(string: "mailto:support@chroniclesync.xyz")!) {
                        HStack {
                            Text("Contact Support")
                            Spacer()
                            Image(systemName: "envelope")
                                .foregroundColor(.accentColor)
                        }
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationBarTitle("Settings", displayMode: .inline)
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}