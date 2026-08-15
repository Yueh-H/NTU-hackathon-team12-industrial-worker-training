import Foundation

public enum StatusJSON {
    public static func encode(_ snapshot: LearningSnapshot) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(snapshot)
    }

    public static func decode(_ data: Data) throws -> LearningSnapshot {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(LearningSnapshot.self, from: data)
    }
}
