# Build and Release Targets

Use this guide when adding build, package, staging, or release scripts. Inspect the game's existing package manager, lockfile, Vite output, Electron/Capacitor versions, Forge configuration, CI hosts, and signing process first. Reuse existing tools and scripts rather than layering a second pipeline on top.

## Target Matrix

| Target | Build pipeline | Host/toolchain | Typical output |
| --- | --- | --- | --- |
| Web | Vite production build | Node.js | Static site directory, commonly `dist/` |
| Electron Windows | Vite, then Electron Forge package/make | Windows runner for a reliable native build | Packaged app plus configured installer/archive |
| Electron macOS | Vite, then Electron Forge package/make | macOS runner with Xcode tools for signing/notarization | `.app` bundle plus configured `.dmg`/`.zip` |
| Electron Linux (optional) | Vite, then Electron Forge package/make | Linux runner | Packaged app plus configured archive/package |
| Steam Windows/macOS | Platform Electron build, then SteamPipe | Matching Windows/macOS artifacts; Steamworks SDK/SteamCMD for upload | Per-OS depot content and Steam build |
| Capacitor iOS | Vite build, `cap sync ios`, native build | macOS with compatible Xcode | Signed `.ipa` or archive |
| Capacitor Android | Vite build, `cap sync android`, native build | Android Studio and Android SDK | Signed `.aab` or `.apk` |

Linux is an optional desktop target, not a substitute for the required Windows and macOS builds. Steam is a distribution channel with its own app/depot setup, not a third desktop packaging target.

## Web Build

Keep the normal browser build independent from optional desktop/mobile SDKs. A Vite project's scripts might include:

```json
{
  "scripts": {
    "dev": "vite",
    "build:web": "vite build",
    "preview": "vite preview"
  }
}
```

Adapt names to the project's existing scripts and package manager. Verify the configured Vite `base`, output directory, and runtime asset paths. Confirm TMX, TSX, ACX, and image URLs resolve from the deployed output, not just the development server. The built web directory should be the input to Electron and Capacitor, not a separately maintained copy of the game.

## Electron: Windows, macOS, Optional Linux

For a new Electron wrapper, prefer Electron Forge unless the project already has a maintained packager. Forge's stages are distinct:

- `electron-forge package` creates a platform-specific application bundle in `out/`; it is not itself a distributable installer.
- `electron-forge make` runs configured Forge makers to create installers or archives from the packaged app, typically under `out/make/`.
- `electron-forge publish` uploads configured publisher targets. Do not run it implicitly as part of local packaging.

Example scripts for a Vite + Forge project:

```json
{
  "scripts": {
    "build:web": "vite build",
    "package:desktop": "npm run build:web && electron-forge package",
    "make:desktop": "npm run build:web && electron-forge make"
  }
}
```

Add Forge makers and maker-specific configuration only for formats the project needs. Run the Windows build on a Windows CI runner and the macOS build on a macOS runner. Cross-platform packaging has caveats; do not promise that a Windows machine can produce a release-ready Mac app or vice versa. Build Linux on a Linux runner if that optional target is enabled. Pin architecture targets deliberately and test each produced artifact on its matching OS.

Code-sign and notarize release builds according to each platform's current requirements. Keep certificates, passwords, Apple credentials, and signing identities in protected CI secrets or a local keychain, never in `package.json`, tracked config, or logged command lines. Test unsigned development builds separately from signed distribution builds.

The Electron renderer remains a web renderer. Keep `nodeIntegration` disabled, `contextIsolation` enabled, and sandboxing enabled unless a reviewed requirement proves otherwise; expose only narrow APIs through preload/context bridge. Set a restrictive Content Security Policy and restrict navigation and new windows. Do not disable `webSecurity` to make asset loading work.

The engine loads maps and images through browser URLs and `fetch()`. For a packaged app, serve bundled files through a standard, secure custom protocol registered with the required privileges (including `supportFetchAPI`) and a `protocol.handle` handler. Resolve requests under the packaged asset root and reject path traversal. Do not assume `file://` or an unregistered custom scheme provides correct relative URL and `fetch()` behavior. Test map-to-tileset-to-image URL resolution inside the packaged app, not only in Vite.

## SteamPipe Staging and Upload

Build and test the Windows and macOS Electron apps first. SteamPipe consumes the resulting platform files as depot content; it does not create the Electron app or its installer. Prefer staging Forge's packaged app bundle, not a setup installer, unless the Steam launch configuration intentionally launches an installer/wrapper.

Steamworks setup is separate from the repository scripts: configure the App ID, Windows/macOS depots, launch options, packages, and branches in Steamworks. Use an App Build VDF and one Depot Build VDF per depot. Map each staged platform directory to the appropriate depot and verify its launch executable/path in Steamworks. Keep SteamCMD credentials outside the repo and use SteamPipe preview builds to validate VDF mappings before upload or release. Uploading and setting a build live must be explicit release operations, never side effects of `npm run build` or the staging helper.

The helper bundled with this skill stages one already-built platform directory:

```sh
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform windows --source out/MyGame-win32-x64 --target steam-content/windows
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform macos --source out/MyGame-darwin-arm64 --target steam-content/macos
```

The first run may create a new target without `--clean`. If that target already exists, the helper refuses to replace it unless `--clean` is explicitly supplied:

```sh
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform windows --source out/MyGame-win32-x64 --target steam-content/windows --clean
```

It copies to a temporary sibling directory before promoting the new staging tree. If the copy fails, the previous target remains untouched. `--clean` authorizes replacement only for the exact validated target path; do not add a blanket `rm -rf` to build scripts.

## Capacitor: iOS and Android

Use the same Vite web build and set Capacitor `webDir` to that build's output (commonly `dist`). Keep Capacitor core, CLI, iOS, and Android package versions aligned. Add only the native platforms the game targets.

The normal sequence is:

```sh
npm run build:web
npx cap sync ios
npx cap open ios
```

```sh
npm run build:web
npx cap sync android
npx cap open android
```

`cap sync` copies the completed web bundle and updates native dependencies; it does not mean the release binary has been compiled. For CLI/CI releases, `npx cap build ios` or `npx cap build android` builds a signed native artifact when the host, signing configuration, and required credentials are correctly set up. Xcode/Android Studio can also build and sign the native project. Follow the exact Capacitor major version's CLI and native toolchain requirements instead of hard-coding old SDK versions into a reusable skill.

iOS requires macOS and Xcode for local native builds. Android requires Android Studio and the Android SDK. Never pass signing passwords as committed script literals or expose them in logs; use a secure signing configuration or CI secret mechanism. Keep the web build, native sync, and native signing/release steps separately invocable so web-only contributors do not need mobile SDKs installed.

Validate the built app on a simulator/emulator and at least one real device per release family where available. Confirm safe-area layout, touch/gamepad input behavior, app resume/pause, audio policy, and all map/tileset/image requests from the native webview.

## Release Script Safety

- Make each package/build/stage action explicit and deterministic; do not upload, publish, sign, or set a Steam branch live during a generic web build.
- Validate platform, source path, output path, and required tools before destructive work.
- Never delete an existing build or staging target unless the caller supplies an explicit option such as `--clean`.
- Prefer writing a complete new output to a temporary sibling path, then swapping it in. Preserve the old output if build or copy fails.
- Refuse filesystem roots, the repository root, symlinks at the target, and source/target overlap for staging scripts.
- Print the selected platform and final artifact paths. Fail non-zero on missing inputs or failed commands; do not hide errors behind shell pipelines.
- Keep generated build directories and secrets out of version control as appropriate; do not clean unrelated user data.

## Official References

- [Electron Forge CLI](https://www.electronforge.io/cli) and [build lifecycle](https://www.electronforge.io/core-concepts/build-lifecycle)
- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol) and [security guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [SteamPipe uploading](https://partner.steamgames.com/doc/sdk/uploading)
- [Capacitor workflow](https://capacitorjs.com/docs/basics/workflow), [CLI](https://capacitorjs.com/docs/cli), [iOS](https://capacitorjs.com/docs/ios), and [Android](https://capacitorjs.com/docs/android)