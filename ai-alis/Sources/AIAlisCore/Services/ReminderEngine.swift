import Foundation

public enum ReminderLevel: String, Codable, Equatable, Sendable {
    case calm
    case nudge
    case due
    case urgent
    case celebrate
}

public struct LearningReminder: Equatable, Sendable {
    public let level: ReminderLevel
    public let title: String
    public let message: String
    public let actionTitle: String

    public init(level: ReminderLevel, title: String, message: String, actionTitle: String) {
        self.level = level
        self.title = title
        self.message = message
        self.actionTitle = actionTitle
    }
}

public enum ReminderEngine {
    public static func reminder(for snapshot: LearningSnapshot, now: Date = Date()) -> LearningReminder {
        if snapshot.overdue > 0 {
            return LearningReminder(
                level: .urgent,
                title: "先救回一張複習卡",
                message: "你有 \(snapshot.overdue) 張逾期，先做最久沒碰的那張。",
                actionTitle: "開始補強"
            )
        }

        if snapshot.dueToday > 0 {
            return LearningReminder(
                level: .due,
                title: "今天有 \(snapshot.dueToday) 張要回想",
                message: snapshot.nextFocus ?? "先完成今天到期的複習，再開新卡。",
                actionTitle: "開始複習"
            )
        }

        if snapshot.totalItems > 0 && snapshot.mastered >= snapshot.totalItems {
            return LearningReminder(
                level: .celebrate,
                title: "這一輪完成了！",
                message: "所有卡片都已掌握，保持短回想就好。",
                actionTitle: "查看成果"
            )
        }

        if snapshot.freshItems > 0 {
            let hasBeenQuiet = snapshot.lastActivityAt.map { now.timeIntervalSince($0) > 6 * 60 * 60 } ?? true
            return LearningReminder(
                level: hasBeenQuiet ? .nudge : .calm,
                title: hasBeenQuiet ? "要不要學一張新的？" : "進度穩穩走",
                message: snapshot.nextFocus ?? "還有 \(snapshot.freshItems) 張新卡，今天學一張就算前進。",
                actionTitle: "繼續學習"
            )
        }

        return LearningReminder(
            level: .calm,
            title: "目前沒有急件",
            message: snapshot.nextFocus ?? "保持每天短時間回想，讓記憶留下來。",
            actionTitle: "查看進度"
        )
    }
}
