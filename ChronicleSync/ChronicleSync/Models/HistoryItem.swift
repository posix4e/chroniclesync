import Foundation

struct HistoryItemModel: Codable, Identifiable {
    let id: String
    let title: String
    let url: String
    let timestamp: Date
    let textContent: String
    let metaTags: [String: String]?
    let links: [Link]?
    
    struct Link: Codable, Identifiable {
        var id: String { href }
        let text: String
        let href: String
    }
    
    init(id: String = UUID().uuidString, title: String, url: String, timestamp: Date, textContent: String, metaTags: [String: String]? = nil, links: [Link]? = nil) {
        self.id = id
        self.title = title
        self.url = url
        self.timestamp = timestamp
        self.textContent = textContent
        self.metaTags = metaTags
        self.links = links
    }
    
    // Convert from JavaScript object format
    init?(fromJavaScript dict: [String: Any]) {
        guard let title = dict["title"] as? String,
              let url = dict["url"] as? String,
              let timestampMs = dict["timestamp"] as? TimeInterval,
              let textContent = dict["textContent"] as? String else {
            return nil
        }
        
        self.id = UUID().uuidString
        self.title = title
        self.url = url
        self.timestamp = Date(timeIntervalSince1970: timestampMs / 1000)
        self.textContent = textContent
        
        if let metaTags = dict["metaTags"] as? [String: String] {
            self.metaTags = metaTags
        } else {
            self.metaTags = nil
        }
        
        if let linksArray = dict["links"] as? [[String: String]] {
            self.links = linksArray.compactMap { linkDict in
                guard let text = linkDict["text"], let href = linkDict["href"] else {
                    return nil
                }
                return Link(text: text, href: href)
            }
        } else {
            self.links = nil
        }
    }
    
    // Convert to JavaScript object format
    func toJavaScript() -> [String: Any] {
        var result: [String: Any] = [
            "id": id,
            "title": title,
            "url": url,
            "timestamp": timestamp.timeIntervalSince1970 * 1000,
            "textContent": textContent
        ]
        
        if let metaTags = metaTags {
            result["metaTags"] = metaTags
        }
        
        if let links = links {
            result["links"] = links.map { link in
                return [
                    "text": link.text,
                    "href": link.href
                ]
            }
        }
        
        return result
    }
}