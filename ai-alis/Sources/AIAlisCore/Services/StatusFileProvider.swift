import Foundation

public protocol LearningStatusProvider: AnyObject {
    var statusFileURL: URL { get }
    var snapshot: LearningSnapshot { get }
    @discardableResult func refresh() -> LearningSnapshot
}

public final class StatusFileProvider: LearningStatusProvider {
    public let statusFileURL: URL
    public private(set) var snapshot: LearningSnapshot

    private let fallback: LearningSnapshot
    private let decoder: JSONDecoder

    public init(statusFileURL: URL = StatusFileProvider.defaultURL(), fallback: LearningSnapshot = .demo()) {
        self.statusFileURL = statusFileURL
        self.fallback = fallback
        self.snapshot = fallback
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }

    @discardableResult
    public func refresh() -> LearningSnapshot {
        guard let data = try? Data(contentsOf: statusFileURL),
              let decoded = try? decoder.decode(LearningSnapshot.self, from: data),
              decoded.schemaVersion == LearningSnapshot.schemaVersion else {
            snapshot = fallback
            return snapshot
        }
        snapshot = decoded
        return snapshot
    }

    public func write(_ snapshot: LearningSnapshot) throws {
        let directory = statusFileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(snapshot).write(to: statusFileURL, options: .atomic)
        self.snapshot = snapshot
    }

    public static func defaultURL(environment: [String: String] = ProcessInfo.processInfo.environment) -> URL {
        if let raw = environment["AI_ALIS_STATUS_FILE"], !raw.isEmpty {
            return URL(fileURLWithPath: NSString(string: raw).expandingTildeInPath)
        }
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
        return appSupport.appendingPathComponent("AIAlis/learning-status.json")
    }
}
