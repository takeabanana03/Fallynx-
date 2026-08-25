# Setup

Every command, in order. Run them from a normal terminal, not inside an editor's
integrated one — Android Studio's toolchain needs the real PATH.

## 0. Prerequisites

```bash
node --version          # 20 or newer
java -version           # 17 or 21, both work with current Gradle
adb --version           # comes with Android Studio platform-tools
```

Windows PowerShell 5.1 has no `&&`. Use `;` or separate lines, and `.\gradlew`
rather than `./gradlew`. `winget install Microsoft.PowerShell` gets you
PowerShell 7, where `&&` works and pasted commands behave as written.

If `adb` is not found, add Android Studio's platform-tools to your PATH.

```powershell
# Windows PowerShell — check it is installed first
Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$sdk\platform-tools", "User")
```

Do not use `setx` for this. It silently truncates at 1024 characters, and
`$env:PATH` is the system and user paths already merged, so `setx PATH
"$env:PATH;..."` copies system entries into your user PATH and can cut the
result short. The .NET call above reads and writes the user PATH only.

Open a new terminal afterwards. Environment changes do not reach a shell that
is already running.

```bash
# macOS / Linux — add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Enable Developer options and USB debugging on the phone, plug it in, accept the
RSA prompt, then confirm it is visible:

```bash
adb devices
```

One device listed as `device` (not `unauthorized`) and you are ready.

## 1. Create the project

```bash
npx create-expo-app@latest fallynx --template blank
cd fallynx
```

This generates a `package.json` pinned to the current Expo SDK. Do not replace
it with one from a tutorial — the versions have to match the SDK you just
installed.

## 2. Copy the Fallynx source in

Copy these from the delivered folder, overwriting what the template made:

```
App.js  index.js  app.json  babel.config.js  .gitignore  .env.example
README.md  assets/  docs/  firebase/  src/
```

Then merge the `scripts` block from the delivered `package.json` into the
generated one. Keep the generated `dependencies` block exactly as it is.

```bash
# macOS / Linux, from inside the fallynx folder
cp -r /path/to/delivered/{App.js,index.js,app.json,babel.config.js,src,assets,docs,firebase,README.md} .
```

## 3. Install dependencies

Always `npx expo install`, never `npm install`, for anything with native code.
`expo install` picks the version matching your SDK; `npm install` picks the
newest, which is how you end up with a white screen on launch.

Phase 1 needs these:

```bash
npx expo install expo-dev-client
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
```

`@expo/vector-icons` ships with Expo already, so the Ionicons import needs no
install.

## 4. Build the development client

Expo Go cannot run Fallynx. It needs native permissions now and a foreground
service from Phase 2, so the app has to be a development build.

```bash
npx expo prebuild --platform android
npx expo run:android
```

The first build takes 10–20 minutes. Gradle downloads most of the internet.
After it finishes, the app is installed on the phone and stays there.

## 5. Day-to-day

```bash
npm start
```

That starts Metro with `--dev-client`. Open Fallynx on the phone and it
connects. Press `r` to reload, `j` to open the debugger.

Re-run `prebuild` and `run:android` only when you add a native dependency or
edit `app.json`. Pure JavaScript changes hot-reload.

## 6. Before the first run

Open `src/config/emergency.js` and put your own number in `TEST_NUMBER`:

```js
export const TEST_MODE = true;
export const TEST_NUMBER = '+230XXXXXXXX';   // your number here
```

`TEST_MODE` stays `true` for the whole build. Every call and message goes to
that number instead of 999, 114 or 995.

## Later phases

Install these when you reach the phase, not before. An unused native dependency
is another thing that can break a build.

```bash
# Phase 2 — sensors and CSV export
npx expo install expo-sensors expo-file-system expo-sharing

# Phase 4 — alerts and dispatch
npx expo install expo-location expo-task-manager expo-notifications
npx expo install expo-audio expo-battery expo-keep-awake
npm install react-native-immediate-phone-call

# Phase 5 — Firebase
npx expo install @react-native-firebase/app @react-native-firebase/auth
npx expo install @react-native-firebase/firestore @react-native-firebase/messaging

# Phase 6 — hardware buttons
npm install react-native-keyevent
```

Every `npm install` in that list is a package with no Expo equivalent, and each
one needs a fresh `npx expo prebuild && npx expo run:android` afterwards.

### Corrections to the earlier plan

**`expo-sensors`, not `react-native-sensors`.** One package gives you
accelerometer, gyroscope, barometer, magnetometer and the light sensor, and it
is already tested against your SDK. Simpler and fewer moving parts.

**There is no `expo-barometer`.** The barometer is part of `expo-sensors`.

**`expo-av` is deprecated.** SDK 56 split it into `expo-audio` and
`expo-video`. Use `expo-audio` for the alarm.

**`expo-sms` will not work for dispatch.** It opens the messaging app and waits
for the user to press send. Fallynx needs silent sending, which Expo does not
expose. Options, in order of effort:

1. Sideload-only build with a small native module wrapping Android's
   `SmsManager` — about 40 lines of Kotlin, and the honest answer for a
   university project
2. A server relay through Twilio or a local Mauritian SMS gateway, which also
   sidesteps the Play Store restricted-permission problem
3. Push notifications only, with SMS as a manual fallback

Decide this before Phase 4, because it changes what that phase builds.

## Firebase, when you reach Phase 5

```bash
npm install -g firebase-tools
firebase login
firebase init firestore functions
```

Download `google-services.json` from the Firebase console into the project
root. It is already in `.gitignore` — keep it there.

```bash
firebase deploy --only firestore:rules
cd firebase/functions && npm install && firebase deploy --only functions
```

## When something breaks

```bash
npx expo-doctor@latest        # first thing to run, catches version mismatches
npx expo install --fix        # realigns every dependency with your SDK
```

White screen on launch is almost always a version mismatch. Run both of the
above before debugging anything else.

```bash
npx expo start --dev-client --clear    # clears the Metro cache
adb logcat *:E                         # native crashes JavaScript never sees
```

Clearing the Gradle cache, in PowerShell:

```powershell
cd android
.\gradlew clean
cd ..
```

`Unsupported class file major version` means Gradle is running on a different
JDK than something expects. Install JDK 17 and point `JAVA_HOME` at it:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

If a build fails after adding a native package, delete `android/` and re-run
`npx expo prebuild --platform android --clean`. The folder is generated and
gitignored, so nothing is lost.
