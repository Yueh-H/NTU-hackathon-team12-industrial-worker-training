import AppKit
import AIAlisCore

enum PetAnimationState: Equatable {
    case idle
    case nudge
    case due
    case urgent
    case celebrate
    case shuffleLeft
    case shuffleRight

    init(level: ReminderLevel) {
        switch level {
        case .calm: self = .idle
        case .nudge: self = .nudge
        case .due: self = .due
        case .urgent: self = .urgent
        case .celebrate: self = .celebrate
        }
    }

    var row: Int {
        switch self {
        case .idle: return 0
        case .shuffleRight: return 1
        case .shuffleLeft: return 2
        case .nudge: return 3
        case .due: return 4
        case .urgent: return 5
        case .celebrate: return 6
        }
    }

    var frameDurations: [TimeInterval] {
        switch self {
        case .idle: return [4.2, 4.0, 4.5, 0.28, 4.0, 4.8]
        case .shuffleRight, .shuffleLeft: return [0.14, 0.14, 0.14, 0.18]
        case .nudge: return [0.12, 0.14, 0.16, 0.22]
        case .due: return [0.12, 0.12, 0.12, 0.14, 0.22]
        case .urgent: return [0.18, 0.18, 0.22, 0.28]
        case .celebrate: return [0.20, 0.20, 0.26]
        }
    }
}

@MainActor
final class PetAtlasView: NSView {
    var onClick: (() -> Void)?
    var onRightClick: ((NSEvent) -> Void)?
    var onPositionChanged: ((NSPoint) -> Void)?

    private var atlas: NSImage?
    private var state: PetAnimationState = .idle
    private var frameIndex = 0
    private var frameTimer: Timer?
    private var mouseDownLocation: NSPoint?
    private var windowOriginAtMouseDown: NSPoint?
    private var didDrag = false
    private var dueCount = 0
    private var overdueCount = 0
    private var progress: Double = 0
    private var reminderLevel: ReminderLevel = .calm
    private var isHovering = false

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        layer?.backgroundColor = NSColor.clear.cgColor
        setAccessibilityElement(true)
        setAccessibilityRole(.button)
        setAccessibilityLabel("AI Alis 學習伴讀桌寵。點擊查看目前學習情況，拖曳可移動位置。")
        addTrackingArea(NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self,
            userInfo: nil
        ))
        atlas = Self.loadAtlas()
        scheduleNextFrame()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    deinit {
        frameTimer?.invalidate()
    }

    func update(snapshot: LearningSnapshot, reminder: LearningReminder) {
        dueCount = snapshot.dueToday
        overdueCount = snapshot.overdue
        progress = snapshot.progress
        reminderLevel = reminder.level
        setState(PetAnimationState(level: reminder.level))
        needsDisplay = true
    }

    func setState(_ newState: PetAnimationState) {
        guard state != newState else { return }
        state = newState
        frameIndex = 0
        frameTimer?.invalidate()
        needsDisplay = true
        scheduleNextFrame()
    }

    func settle(level: ReminderLevel) {
        setState(PetAnimationState(level: level))
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        guard let context = NSGraphicsContext.current else { return }
        context.imageInterpolation = .none

        if let atlas {
            let cellWidth: CGFloat = 192
            let cellHeight: CGFloat = 208
            let sourceY = atlas.size.height - CGFloat(state.row + 1) * cellHeight
            let sourceRect = NSRect(
                x: CGFloat(frameIndex) * cellWidth,
                y: sourceY,
                width: cellWidth,
                height: cellHeight
            )
            let target = bounds.insetBy(dx: 2, dy: 3)
            atlas.draw(
                in: target,
                from: sourceRect,
                operation: .sourceOver,
                fraction: 1,
                respectFlipped: false,
                hints: [.interpolation: NSImageInterpolation.none]
            )
        } else {
            let paragraph = NSMutableParagraphStyle()
            paragraph.alignment = .center
            let attributes: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: min(bounds.width, bounds.height) * 0.56),
                .paragraphStyle: paragraph
            ]
            NSAttributedString(string: "🐈", attributes: attributes)
                .draw(in: NSRect(x: 0, y: bounds.midY - bounds.height * 0.28, width: bounds.width, height: bounds.height * 0.66))
        }

        drawProgressBar()
        drawReminderBadge()
    }

    override func mouseDown(with event: NSEvent) {
        mouseDownLocation = NSEvent.mouseLocation
        windowOriginAtMouseDown = window?.frame.origin
        didDrag = false
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start = mouseDownLocation, let origin = windowOriginAtMouseDown else { return }
        let now = NSEvent.mouseLocation
        let delta = NSPoint(x: now.x - start.x, y: now.y - start.y)
        if abs(delta.x) + abs(delta.y) > 3 {
            didDrag = true
            if abs(delta.x) > 2 { setState(delta.x > 0 ? .shuffleRight : .shuffleLeft) }
        }
        window?.setFrameOrigin(NSPoint(x: origin.x + delta.x, y: origin.y + delta.y))
    }

    override func mouseUp(with event: NSEvent) {
        if didDrag, let origin = window?.frame.origin {
            onPositionChanged?(origin)
            settle(level: reminderLevel)
        } else {
            onClick?()
        }
        mouseDownLocation = nil
        windowOriginAtMouseDown = nil
    }

    override func mouseEntered(with event: NSEvent) {
        isHovering = true
        needsDisplay = true
    }

    override func mouseExited(with event: NSEvent) {
        isHovering = false
        needsDisplay = true
    }

    override func rightMouseDown(with event: NSEvent) {
        onRightClick?(event)
    }

    private func drawProgressBar() {
        let track = NSRect(x: 18, y: 1, width: max(20, bounds.width - 36), height: 4)
        NSColor.black.withAlphaComponent(0.12).setFill()
        NSBezierPath(roundedRect: track, xRadius: 2, yRadius: 2).fill()
        let fill = NSRect(x: track.minX, y: track.minY, width: track.width * progress, height: track.height)
        NSColor.systemGreen.withAlphaComponent(0.85).setFill()
        NSBezierPath(roundedRect: fill, xRadius: 2, yRadius: 2).fill()
    }

    private func drawReminderBadge() {
        let badgeValue = overdueCount > 0 ? overdueCount : dueCount
        guard badgeValue > 0 else { return }
        let diameter: CGFloat = isHovering ? 28 : 24
        let badgeRect = NSRect(x: bounds.maxX - diameter - 3, y: bounds.maxY - diameter - 5, width: diameter, height: diameter)
        (overdueCount > 0 ? NSColor.systemRed : NSColor.systemOrange).setFill()
        NSBezierPath(ovalIn: badgeRect).fill()
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        NSAttributedString(string: badgeValue > 99 ? "99+" : String(badgeValue), attributes: [
            .font: NSFont.monospacedDigitSystemFont(ofSize: badgeValue > 99 ? 8 : 11, weight: .bold),
            .foregroundColor: NSColor.white,
            .paragraphStyle: paragraph
        ]).draw(in: NSRect(x: badgeRect.minX, y: badgeRect.minY + 4, width: badgeRect.width, height: 15))
    }

    private func scheduleNextFrame() {
        frameTimer?.invalidate()
        let durations = state.frameDurations
        let duration = durations[min(frameIndex, durations.count - 1)]
        frameTimer = Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.frameIndex = (self.frameIndex + 1) % durations.count
                self.needsDisplay = true
                self.scheduleNextFrame()
            }
        }
    }

    private static func loadAtlas() -> NSImage? {
        var candidates: [URL] = []
        if let resourceURL = Bundle.module.resourceURL {
            candidates.append(resourceURL.appendingPathComponent("Resources/Pet/alis.webp"))
            candidates.append(resourceURL.appendingPathComponent("Pet/alis.webp"))
            candidates.append(resourceURL.appendingPathComponent("alis.webp"))
        }
        if let custom = ProcessInfo.processInfo.environment["AI_ALIS_ATLAS"], !custom.isEmpty {
            candidates.insert(URL(fileURLWithPath: NSString(string: custom).expandingTildeInPath), at: 0)
        }
        for candidate in candidates where FileManager.default.fileExists(atPath: candidate.path) {
            if let image = NSImage(contentsOf: candidate) { return image }
        }
        return nil
    }
}
