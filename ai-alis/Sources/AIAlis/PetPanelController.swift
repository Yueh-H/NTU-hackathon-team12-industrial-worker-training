import AppKit
import SwiftUI
import AIAlisCore

private final class PetPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

private final class StatusBubblePanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

@MainActor
final class PetPanelController: NSObject {
    let panel: NSPanel
    let petView: PetAtlasView

    private let settings: AIAlisSettingsStore
    private var bubblePanel: NSPanel?

    init(settings: AIAlisSettingsStore) {
        self.settings = settings
        let initialSize = Self.size(for: settings.petScale)
        petView = PetAtlasView(frame: NSRect(origin: .zero, size: initialSize))
        panel = PetPanel(
            contentRect: NSRect(origin: .zero, size: initialSize),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        super.init()
        panel.contentView = petView
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isMovableByWindowBackground = false
        restorePosition()
    }

    func show() {
        panel.orderFrontRegardless()
    }

    func hide() {
        dismissBubble()
        panel.orderOut(nil)
    }

    func applySettings() {
        let newSize = Self.size(for: settings.petScale)
        let oldFrame = panel.frame
        panel.setFrame(
            NSRect(
                x: oldFrame.midX - newSize.width / 2,
                y: oldFrame.minY,
                width: newSize.width,
                height: newSize.height
            ),
            display: true
        )
        petView.frame = NSRect(origin: .zero, size: newSize)
        panel.collectionBehavior = settings.allSpaces ? [.canJoinAllSpaces, .fullScreenAuxiliary] : [.managed]
    }

    func update(snapshot: LearningSnapshot, reminder: LearningReminder) {
        petView.update(snapshot: snapshot, reminder: reminder)
    }

    func savePosition(_ origin: NSPoint) {
        settings.savePosition(origin)
        dismissBubble()
    }

    func showStatus(
        snapshot: LearningSnapshot,
        reminder: LearningReminder,
        onContinue: @escaping () -> Void,
        onRefresh: @escaping () -> Void,
        onOpenStatusFile: @escaping () -> Void
    ) {
        dismissBubble()
        let host = NSHostingController(rootView: StatusBubbleView(
            snapshot: snapshot,
            reminder: reminder,
            onContinue: onContinue,
            onRefresh: onRefresh,
            onOpenStatusFile: onOpenStatusFile,
            onClose: { [weak self] in self?.dismissBubble() }
        ))
        let size = NSSize(width: 404, height: 304)
        host.view.frame = NSRect(origin: .zero, size: size)

        let bubble = StatusBubblePanel(
            contentRect: NSRect(origin: .zero, size: size),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        bubble.contentViewController = host
        bubble.isOpaque = false
        bubble.backgroundColor = .clear
        bubble.hasShadow = true
        bubble.level = .statusBar
        bubble.hidesOnDeactivate = false
        bubble.collectionBehavior = settings.allSpaces ? [.canJoinAllSpaces, .fullScreenAuxiliary] : [.managed]
        bubble.isMovable = false

        let petFrame = panel.frame
        var origin = NSPoint(x: petFrame.midX - size.width / 2, y: petFrame.maxY + 10)
        if let visible = panel.screen?.visibleFrame ?? NSScreen.main?.visibleFrame {
            origin.x = min(max(origin.x, visible.minX + 8), visible.maxX - size.width - 8)
            if origin.y + size.height > visible.maxY {
                origin.y = max(visible.minY + 8, petFrame.minY - size.height - 10)
            }
        }
        bubble.setFrameOrigin(origin)
        bubblePanel = bubble
        NSApp.activate(ignoringOtherApps: true)
        bubble.makeKeyAndOrderFront(nil)
    }

    private func dismissBubble() {
        guard let bubblePanel else { return }
        self.bubblePanel = nil
        bubblePanel.orderOut(nil)
        bubblePanel.contentViewController = nil
    }

    private func restorePosition() {
        let visible = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        var origin = settings.savedPosition() ?? NSPoint(
            x: visible.maxX - panel.frame.width - 28,
            y: visible.minY + 48
        )
        origin.x = min(max(origin.x, visible.minX), visible.maxX - panel.frame.width)
        origin.y = min(max(origin.y, visible.minY), visible.maxY - panel.frame.height)
        panel.setFrameOrigin(origin)
    }

    private static func size(for scale: Double) -> NSSize {
        let height = 188 * min(1.6, max(0.55, scale))
        return NSSize(width: height * 192 / 208, height: height)
    }
}
