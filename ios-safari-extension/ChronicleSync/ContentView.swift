import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var showInstructions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "clock.arrow.circlepath")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 100, height: 100)
                    .foregroundColor(.blue)
                
                Text("ChronicleSync")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Sync your browsing history across devices")
                    .font(.headline)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Spacer().frame(height: 20)
                
                Button(action: {
                    showInstructions = true
                }) {
                    Text("Enable Extension")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                
                Button(action: {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text("Open Settings")
                        .font(.headline)
                        .foregroundColor(.blue)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                
                Spacer()
                
                Text("Version 1.0")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding()
            .navigationBarTitle("", displayMode: .inline)
            .sheet(isPresented: $showInstructions) {
                InstructionsView()
            }
        }
    }
}

struct InstructionsView: View {
    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 20) {
                Text("How to enable the ChronicleSync extension:")
                    .font(.headline)
                    .padding(.top)
                
                VStack(alignment: .leading, spacing: 15) {
                    InstructionStep(number: 1, text: "Open Safari on your device")
                    InstructionStep(number: 2, text: "Tap the 'Aa' button in the address bar")
                    InstructionStep(number: 3, text: "Select 'Manage Extensions'")
                    InstructionStep(number: 4, text: "Enable 'ChronicleSync'")
                    InstructionStep(number: 5, text: "Return to Safari and tap the extension icon to use it")
                }
                
                Spacer()
                
                Image(systemName: "safari")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 100)
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.blue.opacity(0.8))
                    .padding(.bottom)
            }
            .padding()
            .navigationBarTitle("Setup Instructions", displayMode: .inline)
            .navigationBarItems(trailing: Button("Done") {
                // This will dismiss the sheet
            })
        }
    }
}

struct InstructionStep: View {
    let number: Int
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            ZStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 30, height: 30)
                
                Text("\(number)")
                    .foregroundColor(.white)
                    .font(.headline)
            }
            
            Text(text)
                .font(.body)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}