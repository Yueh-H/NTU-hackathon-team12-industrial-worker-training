import AppKit
import AIAlisCore

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let settings = AIAlisSettingsStore()
    private let provider = StatusFileProvider()
    private var petController: PetPanelController!
    private var statusItem: NSStatusItem?
    private var refreshTimer: Timer?
    private var snapshot = LearningSnapshot.demo()
    private var reminder = ReminderEngine.reminder(for: .demo())
    private var hasRefreshedOnce = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)

        seedStatusFileIfNeeded()
        petController = PetPanelController(settings: settings)
        petController.petView.onClick = { [weak self] in self?.showStatusBubble() }
        petController.petView.onRightClick = { [weak self] event in self?.showPetMenu(event) }
        petController.petView.onPositionChanged = { [weak self] origin in self?.petController.savePosition(origin) }

        configureStatusItem()
        refreshStatus(showBubbleOnChange: false)
        if settings.petVisible { petController.show() }
        scheduleRefreshTimer()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            guard let self, self.snapshot.hasWorkToday else { return }
            self.showStatusBubble()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        refreshTimer?.invalidate()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    private func scheduleRefreshTimer() {
        refreshTimer?.invalidate()
        refreshTimer = Timer.scheduledTimer(withTimeInterval: settings.refreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.refreshStatus(showBubbleOnChange: true)
            }
        }
    }

    private func refreshStatus(showBubbleOnChange: Bool) {
        let previousLevel = hasRefreshedOnce ? reminder.level : nil
        snapshot = provider.refresh()
        reminder = ReminderEngine.reminder(for: snapshot)
        hasRefreshedOnce = true
        petController.update(snapshot: snapshot, reminder: reminder)
        rebuildStatusMenu()
        if showBubbleOnChange, previousLevel != reminder.level, snapshot.hasWorkToday {
            showStatusBubble()
        }
    }

    private func showStatusBubble() {
        petController.showStatus(
            snapshot: snapshot,
            reminder: reminder,
            onContinue: { [weak self] in self?.openTraining() },
            onRefresh: { [weak self] in self?.refreshStatus(showBubbleOnChange: false) },
            onOpenStatusFile: { [weak self] in self?.openStatusFile() }
        )
    }

    private func seedStatusFileIfNeeded() {
        guard !FileManager.default.fileExists(atPath: provider.statusFileURL.path) else { return }
        try? provider.write(.demo())
    }

    private func configureStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = NSImage(systemSymbolName: "pawprint.fill", accessibilityDescription: "AI Alis")
        item.button?.toolTip = "AI Alis · 學習伴讀桌寵"
        statusItem = item
        rebuildStatusMenu()
    }

    private func rebuildStatusMenu() {
        guard let statusItem else { return }
        let menu = NSMenu()
        let summary = NSMenuItem(
            title: "今日 (snapshot.dueToday) · 逾期 (snapshot.overdue) · 進度 (Int(snapshot.progress * 100))%",
            action: nil,
            keyEquivalent: ""
        )
        summary.isEnabled = false
        menu.addItem(summary)
        menu.addItem(.separator())
        menu.addItem(menuItem("查看學習情況", action: #selector(showStatusFromMenu)))
        menu.addItem(menuItem("重新讀取狀態", action: #selector(refreshFromMenu)))
        menu.addItem(menuItem("開啟學習頁", action: #selector(openTrainingFromMenu)))
        menu.addItem(menuItem("開啟狀態 JSON", action: #selector(openStatusFileFromMenu)))
        menu.addItem(.separator())
        menu.addItem(menuItem(settings.petVisible ? "隱藏 AI Alis" : "顯示 AI Alis", action: #selector(togglePetFromMenu)))
        menu.addItem(menuItem("結束 AI Alis", action: #selector(quitFromMenu), key: "q"))
        statusItem.menu = menu
    }

    private func showPetMenu(_ event: NSEvent) {
        let menu = NSMenu()
        menu.addItem(menuItem("查看學習情況", action: #selector(showStatusFromMenu)))
        menu.addItem(menuItem("重新讀取狀態", action: #selector(refreshFromMenu)))
        menu.addItem(menuItem("開啟學習頁", action: #selector(openTrainingFromMenu)))
        menu.addItem(.separator())
        menu.addItem(menuItem("開啟狀態 JSON", action: #selector(openStatusFileFromMenu)))
        NSMenu.popUpContextMenu(menu, with: event, for: petController.petView)
    }

    private func menuItem(_ title: String, action: Selector, key: String = "") -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
        item.target = self
        return item
    }

    private func openTraining() {
        guard let url = URL(string: "http://localhost:5173/learn/" + snapshot.learnerID) else { return }
        NSWorkspace.shared.open(url)
    }

    private func openStatusFile() {
        NSWorkspace.shared.open(provider.statusFileURL)
    }

    @objc private func showStatusFromMenu() { showStatusBubble() }
    @objc private func refreshFromMenu() {
        refreshStatus(showBubbleOnChange: false)
        rebuildStatusMenu()
    }
    @objc private func openTrainingFromMenu() { openTraining() }
    @objc private func openStatusFileFromMenu() { openStatusFile() }
    @objc private func togglePetFromMenu() {
        settings.petVisible.toggle()
        if settings.petVisible { petController.show() } else { petController.hide() }
        rebuildStatusMenu()
    }
    @objc private func quitFromMenu() { NSApp.terminate(nil) }
}
