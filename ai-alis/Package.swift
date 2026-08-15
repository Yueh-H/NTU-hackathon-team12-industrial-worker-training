// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "AIAlis",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "AIAlisCore", targets: ["AIAlisCore"]),
        .executable(name: "AIAlis", targets: ["AIAlis"])
    ],
    targets: [
        .target(
            name: "AIAlisCore",
            path: "Sources/AIAlisCore"
        ),
        .executableTarget(
            name: "AIAlis",
            dependencies: ["AIAlisCore"],
            path: "Sources/AIAlis",
            resources: [.copy("Resources")]
        ),
        .executableTarget(
            name: "AIAlisCoreChecks",
            dependencies: ["AIAlisCore"],
            path: "Tests/AIAlisCoreTests"
        )
    ],
    swiftLanguageModes: [.v5]
)
