import Foundation
import AIAlisCore

@main
struct AIAlisCoreChecks {
    static func main() {
        var failures = 0
        checkOverduePriority(&failures)
        checkDueReminder(&failures)
        checkCompletion(&failures)
        checkQuietLearnerNudge(&failures)
        checkStatusFileRoundTrip(&failures)

        if failures > 0 {
            fputs("\(failures) AI Alis core check(s) failed\n", stderr)
            Foundation.exit(1)
        }
        print("AI Alis core checks: all passed")
    }

    private static func checkOverduePriority(_ failures: inout Int) {
        let snapshot = makeSnapshot(dueToday: 5, overdue: 2)
        let reminder = ReminderEngine.reminder(for: snapshot)
        expect(reminder.level == .urgent, "overdue reminder wins", failures: &failures)
        expect(reminder.message == "你有 2 張逾期，先做最久沒碰的那張。", "overdue count appears", failures: &failures)
    }

    private static func checkDueReminder(_ failures: inout Int) {
        let snapshot = makeSnapshot(dueToday: 3, nextFocus: "先複習 seal bawah")
        let reminder = ReminderEngine.reminder(for: snapshot)
        expect(reminder.level == .due, "due reminder level", failures: &failures)
        expect(reminder.actionTitle == "開始複習", "due action is actionable", failures: &failures)
        expect(reminder.message.contains("seal bawah"), "next focus appears", failures: &failures)
    }

    private static func checkCompletion(_ failures: inout Int) {
        let snapshot = makeSnapshot(totalItems: 4, freshItems: 0, mastered: 4)
        expect(ReminderEngine.reminder(for: snapshot).level == .celebrate, "completion celebrates", failures: &failures)
    }

    private static func checkQuietLearnerNudge(_ failures: inout Int) {
        let now = Date()
        let snapshot = makeSnapshot(freshItems: 2, lastActivityAt: now.addingTimeInterval(-8 * 60 * 60))
        expect(ReminderEngine.reminder(for: snapshot, now: now).level == .nudge, "quiet learner gets nudge", failures: &failures)
    }

    private static func checkStatusFileRoundTrip(_ failures: inout Int) {
        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent("ai-alis-(UUID().uuidString)")
            .appendingPathComponent("learning-status.json")
        let original = makeSnapshot(learnerName: "Sari", accuracy: 0.75)
        let provider = StatusFileProvider(statusFileURL: file, fallback: .demo())
        do {
            try provider.write(original)
            let loaded = provider.refresh()
            let fieldsMatch = loaded.learnerID == original.learnerID
                && loaded.learnerName == original.learnerName
                && loaded.totalItems == original.totalItems
                && loaded.dueToday == original.dueToday
                && loaded.overdue == original.overdue
                && loaded.mastered == original.mastered
                && loaded.accuracy == original.accuracy
                && loaded.weakItems == original.weakItems
            expect(fieldsMatch, "status file round trip", failures: &failures)
            expect(loaded.source == .trainingWeb, "status source preserved", failures: &failures)
        } catch {
            expect(false, "status file write: \(error)", failures: &failures)
        }
        try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
    }

    private static func makeSnapshot(
        learnerName: String = "Agus",
        totalItems: Int = 64,
        freshItems: Int = 8,
        dueToday: Int = 0,
        overdue: Int = 0,
        mastered: Int = 20,
        accuracy: Double? = 0.8,
        lastActivityAt: Date? = Date(),
        nextFocus: String? = nil
    ) -> LearningSnapshot {
        LearningSnapshot(
            learnerID: learnerName.lowercased(),
            learnerName: learnerName,
            courseTitle: "防火門零件訓練",
            totalItems: totalItems,
            freshItems: freshItems,
            dueToday: dueToday,
            overdue: overdue,
            mastered: mastered,
            accuracy: accuracy,
            streakDays: 2,
            lastActivityAt: lastActivityAt,
            nextFocus: nextFocus,
            weakItems: ["kaca tahan api"],
            source: .trainingWeb
        )
    }

    private static func expect(_ condition: Bool, _ name: String, failures: inout Int) {
        guard condition else {
            failures += 1
            fputs("FAIL: \(name)\n", stderr)
            return
        }
        print("PASS: \(name)")
    }
}
