# Build and Release Targets

Use this guide when adding build, package, staging, or release scripts. Inspect the game's existing package manager, lockfile, Vite output, Electron/Capacitor versions, Forge configuration, CI hosts, and signing process first. Reuse existing tools and scripts rather than layering a second pipeline on top. For new projects, follow the [default directory layout](./project-architecture.md#default-directory-layout); keep that tree in the game's `AGENTS.md`, not duplicated in README.

## Target Matrix

| Target | Build pipeline | Host/toolchain | Typical output |
| --- | --- | --- | --- |
| Web | Vite production build | Node.js | `dist/web/` static site |
| Electron Windows | Vite, then Electron Forge package/make | Windows runner for a reliable native build | `dist/windows/<arch>/` installer/archive |
| Electron macOS | Vite, then Electron Forge package/make | macOS runner with Xcode tools for signing/notarization | `dist/macos/<arch>/` `.dmg`/`.zip` |
| Electron Linux (optional) | Vite, then Electron Forge package/make | Linux runner | `dist/linux/<arch>/` archive/package |
| Steam Windows/macOS | Platform Electron build, then SteamPipe | Matching Windows/macOS artifacts; Steamworks SDK/SteamCMD for upload | `dist/steam/<platform>/` depot content |
| Capacitor iOS | Vite build, `cap sync ios`, native build | macOS with compatible Xcode | `dist/ios/` exported `.ipa` |
| Capacitor Android | Vite build, `cap sync android`, native build | Android Studio and Android SDK | `dist/android/` signed `.aab`/`.apk` |

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

Set Vite `build.outDir: 'dist/web'` and `publicDir: 'assets'`; choose `base` for the actual deployment (`'./'` for relative packaged URLs). Vite preview must serve that same web output. A web rebuild may empty `dist/web/`, but must not empty the shared `dist/` parent or any other target's output.

Adapt names to the project's existing scripts and package manager. Verify the configured Vite `base`, output directory, and runtime asset paths. Confirm TMX, TSX, ACX, and image URLs resolve from the deployed output, not just the development server. The built web directory should be the input to Electron and Capacitor, not a separately maintained copy of the game.

## Electron: Windows, macOS, Optional Linux

For a new Electron wrapper, prefer Electron Forge unless the project already has a maintained packager. Forge's stages are distinct:

- Set Forge `outDir: '.build/electron'`. `electron-forge package` creates platform-specific application bundles there; these are working apps and Steam staging inputs, not installers.
- `electron-forge make` runs makers under `.build/electron/make/`. Use a `postMake` hook to collect each result's artifacts into `dist/<platform>/<arch>/`, mapping `win32` to `windows`, `darwin` to `macos`, and `linux` to `linux`. Return updated artifact paths from the hook so Forge and CI report the final files.
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

Keep Electron source in `platforms/electron/` and point `package.json.main` at its entrypoint, for example `platforms/electron/main.js`. The runtime protocol must serve `path.join(app.getAppPath(), 'dist', 'web')`. Package only the manifest, `platforms/electron/` and `dist/web/`, preserving their parent directories; exclude mobile projects, other distribution artifacts and caches.

Collect complete output files without silently overwriting an existing release artifact. On a collision, fail with an actionable message or require an explicit replacement flag. Final filenames should retain version/architecture information. Update CI artifact-upload paths to `dist/windows/`, `dist/macos/` or `dist/linux/`; do not upload the working `.build/` tree.

Add Forge makers and maker-specific configuration only for formats the project needs. Run the Windows build on a Windows CI runner and the macOS build on a macOS runner. Cross-platform packaging has caveats; do not promise that a Windows machine can produce a release-ready Mac app or vice versa. Build Linux on a Linux runner if that optional target is enabled. Pin architecture targets deliberately and test each produced artifact on its matching OS.

Code-sign and notarize release builds according to each platform's current requirements. Keep certificates, passwords, Apple credentials, and signing identities in protected CI secrets or a local keychain, never in `package.json`, tracked config, or logged command lines. Test unsigned development builds separately from signed distribution builds.

The Electron renderer remains a web renderer. Keep `nodeIntegration` disabled, `contextIsolation` enabled, and sandboxing enabled unless a reviewed requirement proves otherwise; expose only narrow APIs through preload/context bridge. Set a restrictive Content Security Policy and restrict navigation and new windows. Do not disable `webSecurity` to make asset loading work.

The engine loads maps and images through browser URLs and `fetch()`. For a packaged app, serve bundled files through a standard, secure custom protocol registered with the required privileges (including `supportFetchAPI`) and a `protocol.handle` handler. Resolve requests under the packaged asset root and reject path traversal. Do not assume `file://` or an unregistered custom scheme provides correct relative URL and `fetch()` behavior. Test map-to-tileset-to-image URL resolution inside the packaged app, not only in Vite.

## SteamPipe Staging and Upload

Build and test the Windows and macOS Electron apps first. SteamPipe consumes the resulting platform files as depot content; it does not create the Electron app or its installer. Prefer staging Forge's packaged app bundle, not a setup installer, unless the Steam launch configuration intentionally launches an installer/wrapper.

Steamworks setup is separate from the repository scripts: configure the App ID, Windows/macOS depots, launch options, packages, and branches in Steamworks. Use an App Build VDF and one Depot Build VDF per depot. Map each staged platform directory to the appropriate depot and verify its launch executable/path in Steamworks. Keep SteamCMD credentials outside the repo and use SteamPipe preview builds to validate VDF mappings before upload or release. Uploading and setting a build live must be explicit release operations, never side effects of `npm run build` or the staging helper.

The helper bundled with this skill stages one already-built platform directory into `dist/steam/<platform>/` by default. `--target` remains available for an explicit override:

```sh
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform windows --source .build/electron/MyGame-win32-x64
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform macos --source .build/electron/MyGame-darwin-arm64
```

The first run may create a new target without `--clean`. If that target already exists, the helper refuses to replace it unless `--clean` is explicitly supplied:

```sh
node .agents/skills/jrpg-stellar-engine-game-development/scripts/stage-steam.mjs --platform windows --source .build/electron/MyGame-win32-x64 --clean
```

It copies to a temporary sibling directory before promoting the new staging tree. If the copy fails, the previous target remains untouched. `--clean` authorizes replacement only for the exact validated target path; do not add a blanket `rm -rf` to build scripts.

## Capacitor: iOS and Android

Use the same Vite web build. Configure Capacitor before adding native projects:

```ts
const config: CapacitorConfig = {
  appId: 'com.example.game',
  appName: 'My Game',
  webDir: 'dist/web',
  ios: { path: 'platforms/ios' },
  android: { path: 'platforms/android' },
}
```

Keep Capacitor core, CLI, iOS, and Android package versions aligned. Add only requested platforms with `cap add ios` or `cap add android`, once. Commit the native project sources and configuration, then use `cap sync` after web changes; do not regenerate projects on every build. For a requested migration, move existing projects, update paths and synchronize so generated dependency references resolve from their new locations.

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

`cap sync` copies the completed web bundle and updates native dependencies; it does not mean the release binary has been compiled. For CLI/CI releases, `npx cap build ios` or `npx cap build android` builds a signed native artifact when the host, signing configuration, and required credentials are correctly set up. Xcode/Android Studio can also build and sign the native project. After a successful native build, collect exported IPA files into `dist/ios/` and signed APK/AAB files into `dist/android/`. Implement collection as a separate script that the build command invokes only on success; also make it callable for IDE-produced artifacts. Fail on missing artifacts or destination collisions rather than reporting an empty successful release. Verify the selected Capacitor version's actual export paths and artifact names; do not assume every file in an Android outputs directory is signed.

Leave Xcode/Gradle working directories under their native projects. Use the generated native `.gitignore` rules plus project rules to exclude copied web bundles, build/export directories, `.xcarchive` files, local SDK settings and signing secrets. Moving native projects must preserve these ignore rules. Follow the exact Capacitor major version's CLI and native toolchain requirements instead of hard-coding old SDK versions into a reusable skill.

iOS requires macOS and Xcode for local native builds. Android requires Android Studio and the Android SDK. Never pass signing passwords as committed script literals or expose them in logs; use a secure signing configuration or CI secret mechanism. Keep the web build, native sync, and native signing/release steps separately invocable so web-only contributors do not need mobile SDKs installed.

Validate the built app on a simulator/emulator and at least one real device per release family where available. Confirm safe-area layout, touch/gamepad input behavior, app resume/pause, audio policy, and all map/tileset/image requests from the native webview.

## Release Script Safety

- Make each package/build/stage action explicit and deterministic; do not upload, publish, sign, or set a Steam branch live during a generic web build.
- Validate platform, source path, output path, and required tools before destructive work.
- Never delete an existing build or staging target unless the caller supplies an explicit option such as `--clean`.
- Prefer writing a complete new output to a temporary sibling path, then swapping it in. Preserve the old output if build or copy fails.
- Refuse filesystem roots, the repository root, symlinks at the target, and source/target overlap for staging scripts.
- Print the selected platform and final artifact paths. Fail non-zero on missing inputs or failed commands; do not hide errors behind shell pipelines.
- Ignore `dist/`, `.build/` and `.cache/`; track source projects in `platforms/`. Keep native generated output and secrets out of version control; do not clean unrelated user data. During a layout migration preserve legacy output directories unless their removal is explicitly requested.

## Official References

- [Electron Forge CLI](https://www.electronforge.io/cli) and [build lifecycle](https://www.electronforge.io/core-concepts/build-lifecycle)
- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol) and [security guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [SteamPipe uploading](https://partner.steamgames.com/doc/sdk/uploading)
- [Capacitor workflow](https://capacitorjs.com/docs/basics/workflow), [CLI](https://capacitorjs.com/docs/cli), [iOS](https://capacitorjs.com/docs/ios), and [Android](https://capacitorjs.com/docs/android)