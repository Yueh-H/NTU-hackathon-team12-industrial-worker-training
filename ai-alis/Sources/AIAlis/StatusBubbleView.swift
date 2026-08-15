import SwiftUI
import AIAlisCore

struct StatusBubbleView: View {
    let snapshot: LearningSnapshot
    let reminder: LearningReminder
    let onContinue: () -> Void
    let onRefresh: () -> Void
    let onOpenStatusFile: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 10) {
                Text(icon)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 3) {
                    Text(reminder.title)
                        .font(.headline)
                    Text("AI Alis · (snapshot.learnerName)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark")
                }
                .buttonStyle(.borderless)
                .accessibilityLabel("關閉")
            }

            Text(reminder.message)
                .font(.callout)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(snapshot.courseTitle)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    Spacer()
                    Text("\(snapshot.mastered) / \(snapshot.totalItems)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                ProgressView(value: snapshot.progress)
                    .tint(progressColor)
            }

            HStack(spacing: 8) {
                metric("今日", value: String(snapshot.dueToday), tone: snapshot.dueToday > 0 ? .orange : .secondary)
                metric("逾期", value: String(snapshot.overdue), tone: snapshot.overdue > 0 ? .red : .secondary)
                metric("新卡", value: String(snapshot.freshItems), tone: .secondary)
                metric("正確率", value: snapshot.accuracy.map { "\(Int($0 * 100))%" } ?? "—", tone: .secondary)
            }

            if !snapshot.weakItems.isEmpty {
                Text("容易卡住：" + snapshot.weakItems.joined(separator: "、"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            HStack {
                Button(reminder.actionTitle, action: onContinue)
                    .buttonStyle(.borderedProminent)
                Button("重新讀取", action: onRefresh)
                    .buttonStyle(.borderless)
                Spacer()
                Button("狀態檔", action: onOpenStatusFile)
                    .buttonStyle(.borderless)
            }
        }
        .padding(18)
        .frame(width: 404)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(borderColor.opacity(0.35), lineWidth: 1)
        )
    }

    private var icon: String {
        switch reminder.level {
        case .urgent: return "🚨"
        case .due: return "🔔"
        case .nudge: return "🌱"
        case .celebrate: return "🎉"
        case .calm: return "🐾"
        }
    }

    private var progressColor: Color {
        switch reminder.level {
        case .urgent: return .red
        case .due: return .orange
        case .celebrate: return .green
        case .calm, .nudge: return .blue
        }
    }

    private var borderColor: Color { progressColor }

    private func metric(_ label: String, value: String, tone: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline.monospacedDigit())
                .foregroundStyle(tone)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(9)
        .background(Color.primary.opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
    }
}
