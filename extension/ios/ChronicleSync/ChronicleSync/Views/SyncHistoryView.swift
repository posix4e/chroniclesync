//
//  SyncHistoryView.swift
//  ChronicleSync
//
//  Created by OpenHands AI on 3/15/25.
//

import SwiftUI

struct SyncHistoryView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var searchText = ""
    @State private var historyItems: [HistoryItem] = []
    
    var filteredItems: [HistoryItem] {
        if searchText.isEmpty {
            return historyItems
        } else {
            return historyItems.filter { item in
                item.title.localizedCaseInsensitiveContains(searchText) ||
                item.url.localizedCaseInsensitiveContains(searchText) ||
                item.textContent.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                SearchBar(text: $searchText)
                
                if filteredItems.isEmpty {
                    VStack {
                        Spacer()
                        Text("No history items found")
                            .font(.headline)
                            .foregroundColor(.gray)
                        Text("Your browsing history will appear here")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .padding(.top, 5)
                        Spacer()
                    }
                } else {
                    List {
                        ForEach(filteredItems) { item in
                            HistoryItemRow(item: item)
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationBarTitle("Browsing History", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Clear All") {
                    // Clear history logic would go here
                },
                trailing: Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
            .onAppear {
                loadHistoryItems()
            }
        }
    }
    
    private func loadHistoryItems() {
        // In a real app, you would load history items from storage
        // This is just sample data for demonstration
        historyItems = [
            HistoryItem(
                title: "Example Website",
                url: "https://example.com",
                timestamp: Date().addingTimeInterval(-3600),
                textContent: "This is an example website with some content."
            ),
            HistoryItem(
                title: "GitHub - ChronicleSync",
                url: "https://github.com/posix4e/chroniclesync",
                timestamp: Date().addingTimeInterval(-7200),
                textContent: "ChronicleSync repository on GitHub."
            ),
            HistoryItem(
                title: "Swift Documentation",
                url: "https://developer.apple.com/swift",
                timestamp: Date().addingTimeInterval(-10800),
                textContent: "Swift is a powerful and intuitive programming language for iOS, macOS, tvOS, and watchOS."
            )
        ]
    }
}

struct HistoryItemRow: View {
    let item: HistoryItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(item.title)
                .font(.headline)
                .lineLimit(1)
            
            Text(item.url)
                .font(.subheadline)
                .foregroundColor(.blue)
                .lineLimit(1)
            
            Text(item.timestamp, style: .relative)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.vertical, 5)
    }
}

struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField("Search", text: $text)
                .foregroundColor(.primary)
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

#Preview {
    SyncHistoryView()
}