// Tool 22: Android 17 / API 37 Compliance Checker
// Android 17 shipped to stable on June 16, 2026 (Pixel + AOSP).
// v2.1 corrections, verified against developer.android.com on 2026-10-14:
//   - Games ARE exempt from the API 37 large-screen rules (android:appCategory).
//     v2.0 stated the opposite.
//   - Handoff uses setHandoffEnabled() + onHandoffActivityDataRequested().
//     v2.0 documented an intent action and callback that do not exist.
//   - Added: lock-free MessageQueue, read-only native libs for System.load,
//     app memory limits, config-change recreation, CameraX ≥1.5.2,
//     certificate transparency default, background audio hardening.
//   - Fragment anchors (#…) removed: the official page exposes none, so they
//     pointed nowhere.

export async function android17Compliance(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  const overview = `
# Android 17 / API 37 Compliance Reference
Source: https://developer.android.com/about/versions/17/behavior-changes-17
Status: ✅ Stable — released June 16, 2026 (Pixel, AOSP). Behavior changes below apply when targetSdk = 37
unless marked "all apps".

## What Android 17 / API 37 Changes

Android 17 removes the Android 16 large-screen opt-out and adds breaking
behaviors that affect generated code: reflection-heavy code, LAN networking,
OTP handling, native library loading, and MessageQueue internals.

## ❌ Breaking Change 1 — Static Final Field Reflection (CRITICAL)

Apps targeting Android 17 **cannot modify \`static final\` fields** via reflection
or JNI. This breaks a common pattern used by some DI frameworks and test utilities.

\`\`\`kotlin
// ❌ BREAKS on Android 17 — IllegalAccessException
val field = MyClass::class.java.getDeclaredField("CONSTANT")
field.isAccessible = true
field.set(null, "new_value")     // IllegalAccessException on API 37+

// ❌ ALSO BREAKS via JNI — app crash
// env->SetStaticObjectField() on a final field → crash
\`\`\`

**Impact:** Test code that modifies static final fields for mocking will crash on
API 37 devices. Migrate to dependency injection patterns instead.

\`\`\`kotlin
// ✅ Correct — inject the value instead of modifying the field
class MyViewModel(
  private val config: String = BuildConfig.API_URL   // injected, not reflected
) : ViewModel()
\`\`\`

Source: https://developer.android.com/about/versions/17/behavior-changes-17

## ❌ Breaking Change 2 — ACCESS_LOCAL_NETWORK (New Permission)

Local network access is blocked by default for apps targeting Android 17. Two paths:
use a system-mediated device picker (no permission prompt), or request the new
\`ACCESS_LOCAL_NETWORK\` runtime permission. It belongs to the NEARBY_DEVICES group,
so users who already granted another NEARBY_DEVICES permission are not prompted again.

**Affects:** Any app that connects to local IP addresses, mDNS/Bonjour discovery,
SSDP, or direct socket connections on 192.168.x.x / 10.x.x.x ranges.

\`\`\`xml
<!-- AndroidManifest.xml — required for Android 17+ LAN access -->
<uses-permission android:name="android.permission.ACCESS_LOCAL_NETWORK" />
\`\`\`

\`\`\`kotlin
// Runtime check before connecting to local IPs
if (Build.VERSION.SDK_INT >= 37) {
  val granted = ContextCompat.checkSelfPermission(
    context, "android.permission.ACCESS_LOCAL_NETWORK"
  ) == PackageManager.PERMISSION_GRANTED
  if (!granted) {
    // Request permission before LAN operation
    launcher.launch("android.permission.ACCESS_LOCAL_NETWORK")
    return
  }
}
\`\`\`

Source: https://developer.android.com/privacy-and-security/local-network-permission

## ❌ Breaking Change 3 — SMS OTP Protection (3-Hour Delay)

For most apps targeting Android 17, standard SMS messages containing an OTP are
withheld for **three hours**: \`SMS_RECEIVED_ACTION\` is not delivered and SMS provider
queries are filtered. WebOTP-format messages are delayed for every app that is not the
intended recipient, regardless of targetSdk. Default SMS, assistant, and connected
companion apps are exempt.

\`\`\`kotlin
// ❌ OLD pattern — delayed by 3 hours on API 37+ targets
val smsReceiver = object : BroadcastReceiver() {
  override fun onReceive(ctx: Context, intent: Intent) {
    // SMS body will be withheld for 3 hours on API 37+
    val body = intent.extras?.get("pdus")
  }
}

// ✅ Correct — use SMS User Consent API (no delay, user-approved)
val task = SmsRetriever.getClient(context).startSmsUserConsent(senderPhoneNumber)
task.addOnSuccessListener {
  // Register broadcast receiver for SMS_RETRIEVED_ACTION
}
\`\`\`

**Migration:** Use the SMS Retriever API or the SMS User Consent API
(\`SmsRetriever.startSmsUserConsent()\`). These are the paths Google names for OTP.

Source: https://developer.android.com/about/versions/17/behavior-changes-17
Guide: https://developer.android.com/identity/sms-retriever

## ❌ Breaking Change 4 — Large-Screen Opt-Out Removed (API 37+)

Android 16 began ignoring orientation, resizability, and aspect-ratio restrictions on
large screens (smallest width ≥ 600dp) for API 36 targets, with a temporary opt-out.
**For API 37 targets the opt-out is gone.** Ignored on large screens:

- \`android:screenOrientation\`, \`setRequestedOrientation()\`, \`getRequestedOrientation()\`
  (portrait / landscape / sensor* / reverse* / user* values)
- \`android:resizeableActivity="false"\`
- \`android:minAspectRatio\`, \`android:maxAspectRatio\`

**Exemptions (still apply on API 37):**
- **Games**, identified by the \`android:appCategory="game"\` manifest flag
- Users who explicitly opt the app back into its default behavior in device aspect-ratio settings
- Screens with smallest width below 600dp (phones)

\`\`\`xml
<!-- ❌ Ignored on ≥600dp displays for API 37 targets (unless the app is a game) -->
<activity
  android:screenOrientation="portrait"
  android:resizeableActivity="false"
  android:maxAspectRatio="1.86" />
\`\`\`

Source: https://developer.android.com/about/versions/17/changes/ff-restrictions-ignored

## ❌ Breaking Change 5 — Lock-Free MessageQueue

Apps targeting API 37 get a new lock-free \`android.os.MessageQueue\`. Code that reflects
on its private fields or methods may break. For tests, \`TestLooperManager\` adds
\`peekWhen()\` and \`poll()\`.

## ❌ Breaking Change 6 — Read-Only Native Libraries

Safer Dynamic Code Loading now covers native code: every file loaded with
\`System.load()\` must be read-only, or \`UnsatisfiedLinkError\` is thrown.

\`\`\`kotlin
val lib = File(context.codeCacheDir, "libplugin.so")
lib.setReadOnly()            // required on API 37 targets
System.load(lib.absolutePath)
\`\`\`

## ⚠️ Other Android 17 Changes to Check

- **Activity recreation:** activities are no longer restarted for \`CONFIG_KEYBOARD\`,
  \`CONFIG_KEYBOARD_HIDDEN\`, \`CONFIG_NAVIGATION\`, \`CONFIG_TOUCHSCREEN\`, \`CONFIG_COLOR_MODE\`;
  they get \`onConfigurationChanged()\`. Opt back in with \`android:recreateOnConfigChanges\`.
- **App memory limits:** the system kills processes over a RAM-based limit;
  \`ApplicationExitInfo.getDescription()\` reports \`"MemoryLimiter:AnonSwap"\`.
- **Background audio hardening:** restrictions on playback, audio focus, and volume APIs
  from the background; alarm audio is exempt.
- **Certificate transparency** is enabled by default; **ECH** (Encrypted Client Hello) is enabled.
- **CameraX (all apps on Android 17 devices):** use 1.5.2 or 1.6.0+ to avoid a crash.
- **Custom notification views:** size limits tightened.

Source: https://developer.android.com/about/versions/17/behavior-changes-17
Release post: https://developer.android.com/blog/posts/android-17-is-here
`;

  const npu = `
# Android 17 — NPU Access (Neural Processing Unit)
Source: https://developer.android.com/blog/posts/android-17-is-here

## What Changed

Apps that access the NPU **directly** must declare
\`PackageManager.FEATURE_NEURAL_PROCESSING_UNIT\` in the manifest with \`<uses-feature>\`.
Take the feature string from that constant in the API 37 reference rather than typing it
from memory, and set \`android:required="false"\` if the app also works without an NPU.

## When This Applies

- Apps using the LiteRT NPU delegate
- Apps using vendor NPU SDKs
- Apps calling NNAPI directly

Apps that only use system-managed AI (for example Gemini Nano via ML Kit GenAI / AICore)
are not accessing the NPU directly.

## Recommended Pattern

\`\`\`kotlin
// Check NPU availability at runtime before using NPU-accelerated paths
val packageManager = context.packageManager
val hasNpu = packageManager.hasSystemFeature(PackageManager.FEATURE_NEURAL_PROCESSING_UNIT)

if (hasNpu) {
  // Use NPU-accelerated on-device AI
  initializeNpuAcceleratedModel()
} else {
  // Fall back to CPU inference or cloud
  initializeCloudModel()
}
\`\`\`

Source: https://developer.android.com/blog/posts/android-17-is-here
`;

  const handoff = `
# Android 17 — Handoff API (Continue On)
Source: https://developer.android.com/blog/posts/android-17-is-here

## What Handoff Is

Handoff ("Continue On") lets a user start an activity on one device and continue it on
another device signed in to the same account. The receiving device opens your app with
state your activity provides.

## Implementation (official API surface)

\`\`\`kotlin
class EditorActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // 1. Opt this activity in to Handoff
    setHandoffEnabled(true, null)
  }

  // 2. Supply the state the other device needs to resume
  override fun onHandoffActivityDataRequested(
    request: HandoffActivityDataRequestInfo
  ): HandoffActivityData {
    // Build HandoffActivityData describing the document / position to resume.
    // Check the API 37 reference for the builder and fields — do not guess them.
    TODO("Return HandoffActivityData for the current session")
  }
}
\`\`\`

> ⚠️ AndroJack verified only the entry points above (\`setHandoffEnabled(true, null)\` and
> \`onHandoffActivityDataRequested(HandoffActivityDataRequestInfo): HandoffActivityData\`).
> Look up \`HandoffActivityData\` in the API 37 reference before writing its construction code.
> v2.0 of this tool documented an \`android.intent.action.HANDOFF\` intent filter and an
> \`onProvideHandoffData()\` callback; neither exists.

## When to Implement

- Long-running user sessions (editing, media playback, reading)
- State that is meaningful to resume on a larger or different screen

## Handoff vs. Cross-Device Copy
Handoff transfers **active session state**, not clipboard content.

Source: https://developer.android.com/blog/posts/android-17-is-here
`;

  const checklist = `
# Android 17 / API 37 Compliance Checklist
Source: https://developer.android.com/about/versions/17/behavior-changes-17

## Before Targeting API 37

### Static Final Reflection Audit
- [ ] Search codebase for \`field.isAccessible = true\` followed by \`field.set()\`
- [ ] Search for JNI calls that modify static fields
- [ ] Check test code for Mockito/PowerMock static mocking — may need migration
- [ ] Replace reflected static final mutations with constructor/DI injection

### Local Network (LAN) Audit
- [ ] Search for socket connections to 192.168.x.x, 10.x.x.x, or 172.x.x.x ranges
- [ ] Search for mDNS/NSD usage (\`NsdManager\`, \`mDNS\`)
- [ ] Search for SSDP/UPnP discovery code
- [ ] Prefer a system-mediated device picker (no permission prompt) where one exists
- [ ] Otherwise declare and request \`ACCESS_LOCAL_NETWORK\` at runtime before LAN operations

### SMS OTP Migration
- [ ] Remove \`SMS_RECEIVED\` broadcast receiver used for OTP auto-fill
- [ ] Replace with the SMS Retriever API or \`SmsRetriever.startSmsUserConsent()\`
- [ ] Test OTP flow on API 37 emulator — old pattern will be delayed 3 hours

### Large-Screen (Android 16 opt-out removed)
- [ ] Remove \`android:screenOrientation\` locks and \`setRequestedOrientation()\` calls (non-game apps)
- [ ] Remove all \`android:resizeableActivity="false"\` attributes
- [ ] Remove \`android:minAspectRatio\` / \`android:maxAspectRatio\` restrictions
- [ ] Games: confirm \`android:appCategory="game"\` is set — the exemption still applies at API 37
- [ ] Test on a ≥600dp emulator in both orientations and in multi-window

### MessageQueue / Native Code
- [ ] Remove reflection on \`MessageQueue\` private fields/methods
- [ ] Mark every file passed to \`System.load()\` read-only, or switch to \`System.loadLibrary()\`

### Dependencies (all apps on Android 17 devices)
- [ ] CameraX ≥ 1.5.2 (or 1.6.0+)

### Automate it
- [ ] Run \`npx androjack-mcp validate . --target-sdk=37\` in CI (SARIF: \`--format=sarif\`)

### NPU (if applicable)
- [ ] Declare \`PackageManager.FEATURE_NEURAL_PROCESSING_UNIT\` via \`<uses-feature>\` if you access the NPU directly
- [ ] Add runtime NPU availability check before NPU-accelerated code paths

Source: https://developer.android.com/about/versions/17/behavior-changes-17
`;

  if (t.includes("npu") || t.includes("neural") || t.includes("processor")) {
    return npu;
  }
  if (t.includes("handoff") || t.includes("cross-device") || t.includes("continuity")) {
    return handoff;
  }
  if (t.includes("checklist") || t.includes("audit") || t.includes("migrate")) {
    return checklist;
  }
  if (t.includes("static final") || t.includes("reflection")) {
    return overview.split("## ❌ Breaking Change 2")[0];
  }
  if (t.includes("local network") || t.includes("lan") || t.includes("access_local")) {
    const start = overview.indexOf("## ❌ Breaking Change 2");
    const end = overview.indexOf("## ❌ Breaking Change 3");
    return overview.slice(start, end);
  }
  if (t.includes("sms") || t.includes("otp")) {
    const start = overview.indexOf("## ❌ Breaking Change 3");
    const end = overview.indexOf("## ❌ Breaking Change 4");
    return overview.slice(start, end);
  }
  if (t.includes("large screen") || t.includes("orientation") || t.includes("resiz") || t.includes("game")) {
    const start = overview.indexOf("## ❌ Breaking Change 4");
    const end = overview.indexOf("## ❌ Breaking Change 5");
    return overview.slice(start, end);
  }
  if (t.includes("messagequeue") || t.includes("message queue") || t.includes("system.load") || t.includes("native")) {
    const start = overview.indexOf("## ❌ Breaking Change 5");
    const end = overview.indexOf("## ⚠️ Other Android 17 Changes");
    return overview.slice(start, end);
  }

  return overview + "\n\n---\n\n" +
    "**Query topics:** 'checklist' (full API 37 migration checklist), " +
    "'static final' (reflection breaking change), " +
    "'local network' (ACCESS_LOCAL_NETWORK permission), " +
    "'sms otp' (3-hour delay migration), " +
    "'large screen' (opt-out removal, games exemption), " +
    "'messagequeue' / 'native' (lock-free MessageQueue, read-only System.load), " +
    "'npu' (Neural Processing Unit feature declaration), " +
    "'handoff' (cross-device continuity API)\n\n" +
    "Source: https://developer.android.com/about/versions/17";
}
