import Foundation
import NaturalLanguage
import CoreML
import Vision
import WebKit

class ContentSummarizer {
    
    // MARK: - Properties
    
    private let maxSummaryLength = 200
    private let maxContentLength = 50000
    
    // MARK: - Public Methods
    
    /// Summarize content from a webpage using iOS native NLP capabilities
    /// - Parameters:
    ///   - webView: The WKWebView containing the page to summarize
    ///   - completion: Callback with the summarized content
    func summarizeWebContent(in webView: WKWebView, completion: @escaping (Result<PageContentSummary, Error>) -> Void) {
        // Extract text content from the web view
        webView.evaluateJavaScript("""
            (function() {
                // Get the page title
                const title = document.title;
                
                // Try to get the main content
                let content = '';
                
                // First try to find article content
                const article = document.querySelector('article');
                if (article) {
                    content = article.innerText;
                } else {
                    // Try to get main content
                    const main = document.querySelector('main');
                    if (main) {
                        content = main.innerText;
                    } else {
                        // Fall back to body content
                        content = document.body.innerText;
                    }
                }
                
                // Get all images with their alt text and src
                const images = Array.from(document.querySelectorAll('img')).map(img => {
                    return {
                        src: img.src,
                        alt: img.alt || '',
                        width: img.width,
                        height: img.height
                    };
                }).filter(img => img.width > 100 && img.height > 100); // Filter out small images
                
                return { title, content, images };
            })()
        """) { [weak self] result, error in
            guard let self = self else { return }
            
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let extractedData = result as? [String: Any],
                  let title = extractedData["title"] as? String,
                  let content = extractedData["content"] as? String else {
                completion(.failure(NSError(domain: "ContentSummarizer", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to extract content"])))
                return
            }
            
            // Limit content size
            let truncatedContent = content.count > self.maxContentLength ? 
                String(content.prefix(self.maxContentLength)) : content
            
            // Process the content using NLP
            self.processContent(title: title, content: truncatedContent) { result in
                completion(result)
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func processContent(title: String, content: String, completion: @escaping (Result<PageContentSummary, Error>) -> Void) {
        // Create a background queue for processing
        let processingQueue = DispatchQueue(label: "xyz.chroniclesync.contentProcessing", qos: .userInitiated)
        
        processingQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Extract key sentences for summary
            let summary = self.generateSummary(from: content)
            
            // Extract keywords
            let keywords = self.extractKeywords(from: content)
            
            // Create the content summary
            let pageContent = PageContentSummary(
                content: content,
                summary: summary,
                keywords: keywords,
                extractedAt: Date().timeIntervalSince1970 * 1000
            )
            
            // Return on main thread
            DispatchQueue.main.async {
                completion(.success(pageContent))
            }
        }
    }
    
    private func generateSummary(from content: String) -> String {
        // Use NLTagger to identify sentences
        let tagger = NLTagger(tagSchemes: [.tokenType, .lemma, .lexicalClass])
        tagger.string = content
        
        // Extract sentences
        var sentences: [String] = []
        tagger.enumerateTags(in: content.startIndex..<content.endIndex, unit: .sentence, scheme: .tokenType) { _, range in
            let sentence = String(content[range])
            sentences.append(sentence)
            return true
        }
        
        // If we have very few sentences, just return the first few
        if sentences.count <= 3 {
            return sentences.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        // For longer content, use a more sophisticated approach
        // Here we'll use a simple approach of taking the first sentence and a couple from the middle
        var summaryParts: [String] = []
        
        // Add the first sentence (usually important)
        if !sentences.isEmpty {
            summaryParts.append(sentences[0])
        }
        
        // Add a couple sentences from the middle (often contain key information)
        let middleIndex = sentences.count / 2
        if sentences.count > middleIndex {
            summaryParts.append(sentences[middleIndex])
        }
        if sentences.count > middleIndex + 1 {
            summaryParts.append(sentences[middleIndex + 1])
        }
        
        // Join and truncate if needed
        let summary = summaryParts.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        if summary.count > maxSummaryLength {
            return String(summary.prefix(maxSummaryLength)) + "..."
        }
        
        return summary
    }
    
    private func extractKeywords(from content: String) -> [String] {
        let tagger = NLTagger(tagSchemes: [.lexicalClass])
        tagger.string = content
        
        var keywords: [String: Int] = [:]
        
        // Tag the text for parts of speech
        tagger.enumerateTags(in: content.startIndex..<content.endIndex, unit: .word, scheme: .lexicalClass) { tag, range in
            // Focus on nouns and proper nouns as keywords
            if let tag = tag, (tag == .noun || tag == .personalName || tag == .placeName || tag == .organizationName) {
                let word = String(content[range]).lowercased()
                // Filter out short words and common stop words
                if word.count > 3 && !isStopWord(word) {
                    keywords[word, default: 0] += 1
                }
            }
            return true
        }
        
        // Sort by frequency and take top 10
        let sortedKeywords = keywords.sorted { $0.value > $1.value }.prefix(10).map { $0.key }
        return Array(sortedKeywords)
    }
    
    private func isStopWord(_ word: String) -> Bool {
        // Common English stop words
        let stopWords = ["the", "and", "that", "have", "for", "not", "with", "you", "this", "but", "his", "from", "they", "she", "will", "would", "there", "their", "what", "about", "which", "when", "make", "like", "time", "just", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "cant", "cant"]
        
        return stopWords.contains(word)
    }
}

// Model for page content summary
struct PageContentSummary {
    let content: String
    let summary: String
    let keywords: [String]
    let extractedAt: Double
    
    func toDictionary() -> [String: Any] {
        return [
            "content": content,
            "summary": summary,
            "keywords": keywords,
            "extractedAt": extractedAt
        ]
    }
}