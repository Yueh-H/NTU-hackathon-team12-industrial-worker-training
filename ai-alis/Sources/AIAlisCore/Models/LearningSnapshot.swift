import Foundation

public enum SnapshotSource: String, Codable, Sendable {
    case trainingWeb = "training-web"
    case demo
}

public struct LearningSnapshot: Codable, Equatable, Sendable {
    public static let schemaVersion = 1

    public var schemaVersion: Int
    public var generatedAt: Date
    public var learnerID: String
    public var learnerName: String
    public var courseTitle: String
    public var totalItems: Int
    public var freshItems: Int
    public var dueToday: Int
    public var overdue: Int
    public var mastered: Int
    public var accuracy: Double?
    public var streakDays: Int
    public var lastActivityAt: Date?
    public var nextFocus: String?
    public var weakItems: [String]
    public var source: SnapshotSource

    public init(
        schemaVersion: Int = LearningSnapshot.schemaVersion,
        generatedAt: Date = Date(),
        learnerID: String,
        learnerName: String,
        courseTitle: String,
        totalItems: Int,
        freshItems: Int,
        dueToday: Int,
        overdue: Int,
        mastered: Int,
        accuracy: Double?,
        streakDays: Int,
        lastActivityAt: Date?,
        nextFocus: String?,
        weakItems: [String],
        source: SnapshotSource
    ) {
        self.schemaVersion = schemaVersion
        self.generatedAt = generatedAt
        self.learnerID = learnerID
        self.learnerName = learnerName
        self.courseTitle = courseTitle
        self.totalItems = max(0, totalItems)
        self.freshItems = max(0, freshItems)
        self.dueToday = max(0, dueToday)
        self.overdue = max(0, overdue)
        self.mastered = min(max(0, mastered), max(0, totalItems))
        self.accuracy = accuracy.map { min(1, max(0, $0)) }
        self.streakDays = max(0, streakDays)
        self.lastActivityAt = lastActivityAt
        self.nextFocus = nextFocus
        self.weakItems = Array(weakItems.prefix(3))
        self.source = source
    }

    public var progress: Double {
        guard totalItems > 0 else { return 0 }
        return min(1, max(0, Double(mastered) / Double(totalItems)))
    }

    public var pendingCount: Int {
        dueToday + overdue
    }

    public var hasWorkToday: Bool {
        pendingCount > 0 || freshItems > 0
    }

    public static func demo(now: Date = Date()) -> LearningSnapshot {
        LearningSnapshot(
            learnerID: "agus",
            learnerName: "Agus",
            courseTitle: "防火門零件訓練",
            totalItems: 64,
            freshItems: 18,
            dueToday: 4,
            overdue: 1,
            mastered: 27,
            accuracy: 0.82,
            streakDays: 3,
            lastActivityAt: now.addingTimeInterval(-45 * 60),
            nextFocus: "先複習：kaca tahan api",
            weakItems: ["kaca tahan api", "grendel 3 titik"],
            source: .demo
        )
    }
}
