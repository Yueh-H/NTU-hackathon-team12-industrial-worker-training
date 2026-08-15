import AppKit
import Combine
import Foundation

@MainActor
final class AIAlisSettingsStore: ObservableObject {
    @Published var petScale: Double {
        didSet { save(Key.petScale, petScale) }
    }

    @Published var allSpaces: Bool {
        didSet { save(Key.allSpaces, allSpaces) }
    }

    @Published var petVisible: Bool {
        didSet { save(Key.petVisible, petVisible) }
    }

    @Published var refreshInterval: Double {
        didSet { save(Key.refreshInterval, refreshInterval) }
    }

    private enum Key {
        static let petScale = "aiAlis.petScale"
        static let allSpaces = "aiAlis.allSpaces"
        static let petVisible = "aiAlis.petVisible"
        static let refreshInterval = "aiAlis.refreshInterval"
    }

    init(defaults: UserDefaults = .standard) {
        let storedScale = defaults.object(forKey: Key.petScale) as? Double
        petScale = min(1.6, max(0.55, storedScale ?? 0.82))
        allSpaces = defaults.object(forKey: Key.allSpaces) as? Bool ?? true
        petVisible = defaults.object(forKey: Key.petVisible) as? Bool ?? true
        let storedInterval = defaults.object(forKey: Key.refreshInterval) as? Double
        refreshInterval = min(300, max(10, storedInterval ?? 20))
    }

    func savePosition(_ origin: NSPoint) {
        UserDefaults.standard.set(Double(origin.x), forKey: "aiAlis.position.x")
        UserDefaults.standard.set(Double(origin.y), forKey: "aiAlis.position.y")
    }

    func savedPosition() -> NSPoint? {
        let defaults = UserDefaults.standard
        guard defaults.object(forKey: "aiAlis.position.x") != nil,
              defaults.object(forKey: "aiAlis.position.y") != nil else { return nil }
        return NSPoint(
            x: defaults.double(forKey: "aiAlis.position.x"),
            y: defaults.double(forKey: "aiAlis.position.y")
        )
    }

    private func save(_ key: String, _ value: Any) {
        UserDefaults.standard.set(value, forKey: key)
    }
}
