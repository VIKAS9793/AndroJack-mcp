// Tool 22: Android 17 / API 37 Compliance Checker
// Android 17 reached platform stability (Beta 3) on March 26, 2026.
// API surface is now locked — developers can finalize compatibility testing.
// Key new breaking rules: static final reflection blocks, ACCESS_LOCAL_NETWORK,
// OTP protection delay, extended large-screen resizability enforcement on API 37+.

export async function android17Compliance(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  const overview = `
# Android 17 / API 37 Compliance Reference
Source: https://developer.android.com/about/versions/17/behavior-changes-17
Status: Platform stable (Beta 3, March 26, 2026) — API surface locked.

## What Android 17 / API 37 Changes

Android 17 extends the large-screen mandates introduced in Android 16 and
adds several new breaking behaviors that affect generated code, especially
reflection-heavy code, LAN networking, and OTP handling.

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

Source: https://developer.android.com/about/versions/17/behavior-changes-17#static-final-reflection

## ❌ Breaking Change 2 — ACCESS_LOCAL_NETWORK (New Permission)

Apps targeting Android 17 that communicate over the local area network (LAN) must
declare the new \`ACCESS_LOCAL_NETWORK\` permission. This protects local network
access as part of the NEARBY_DEVICES group.

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

Source: https://developer.android.com/about/versions/17/behavior-changes-17#local-network

## ❌ Breaking Change 3 — SMS OTP Protection (3-Hour Delay)

Apps targeting Android 17 will experience a **3-hour delay** in programmatic
access to SMS OTP messages. This blocks the pattern of reading SMS in background
for auto-fill OTP flows.

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

**Migration:** Use \`SmsRetriever.startSmsUserConsent()\` or the
\`SmsCodeRetriever\` API from Play Services. These are not delayed.

Source: https://developer.android.com/about/versions/17/behavior-changes-17#sms-otp

## ❌ Breaking Change 4 — Extended Large-Screen Resizability (API 37+)

Android 17 extends the API 36 large-screen rules. Apps targeting API 37 on
devices ≥600dp **cannot opt out** of resizing or orientation changes, even
through the games exemption that was available in API 36.

\`\`\`xml
<!-- ❌ All of these are overridden by the system on ≥600dp / API 37 targets -->
<activity
  android:screenOrientation="portrait"
  android:resizeableActivity="false"
  android:maxAspectRatio="1.86"
/>
<!-- The android:appCategory="game" exemption no longer applies at API 37 -->
\`\`\`

Source: https://developer.android.com/about/versions/17/behavior-changes-17#large-screens
`;

  const npu = `
# Android 17 — NPU Access (Neural Processing Unit)
Source: https://developer.android.com/about/versions/17/behavior-changes-17#npu

## What Changed

Apps targeting Android 17 that directly access the device NPU must declare
hardware feature support in the manifest.

\`\`\`xml
<!-- AndroidManifest.xml — required if app directly uses NPU APIs -->
<uses-feature
  android:name="android.hardware.neural_processing_unit"
  android:required="false" />   <!-- false = app works without NPU, enhances with it -->
\`\`\`

## When This Applies

- Apps using ML Kit GenAI (AICore) with NPU acceleration
- Apps calling Android NNAPI directly
- Apps integrating with on-device LLM runtimes that target the NPU

## Recommended Pattern

\`\`\`kotlin
// Check NPU availability at runtime before using NPU-accelerated paths
val packageManager = context.packageManager
val hasNpu = packageManager.hasSystemFeature("android.hardware.neural_processing_unit")

if (hasNpu) {
  // Use NPU-accelerated on-device AI
  initializeNpuAcceleratedModel()
} else {
  // Fall back to CPU inference or cloud
  initializeCloudModel()
}
\`\`\`

Source: https://developer.android.com/about/versions/17/behavior-changes-17#npu
`;

  const handoff = `
# Android 17 — Handoff API (Cross-Device Continuity)
Source: https://developer.android.com/about/versions/17/features#handoff

## What Handoff Is

Handoff lets users start an Activity on one Android device and seamlessly
transfer it to another Android device. The receiving device launches the same
app (if installed) with state provided by the sending device.

## When to Implement

Implement Handoff if your app has:
- Long-running user sessions (editing, media playback, reading)
- State that is meaningful to resume on a larger or different screen
- Multi-device workflows (start draft on phone, finish on tablet)

## Implementation

\`\`\`kotlin
// 1. Declare Handoff support in AndroidManifest.xml
<activity android:name=".EditorActivity">
  <intent-filter>
    <action android:name="android.intent.action.HANDOFF" />
    <category android:name="android.intent.category.DEFAULT" />
  </intent-filter>
</activity>

// 2. Provide Handoff state from the sending device
class EditorActivity : AppCompatActivity() {
  override fun onProvideHandoffData(): Bundle {
    return bundleOf(
      "document_id" to currentDocumentId,
      "scroll_position" to editorScrollPosition,
      "cursor_position" to editorCursorPosition
    )
  }
}

// 3. Receive Handoff state on the target device
class EditorActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val handoffData = intent.getBundleExtra("android.intent.extra.HANDOFF_DATA")
    if (handoffData != null) {
      val documentId = handoffData.getString("document_id")
      openDocument(documentId)
    }
  }
}
\`\`\`

## Handoff vs. Cross-Device Copy
Handoff transfers **active session state**, not clipboard content.
For static data sharing between devices, use the Clipboard or Share Sheet instead.

Source: https://developer.android.com/about/versions/17/features#handoff
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
- [ ] Add \`ACCESS_LOCAL_NETWORK\` to manifest if any LAN access found
- [ ] Add runtime permission check before LAN operations

### SMS OTP Migration
- [ ] Remove \`SMS_RECEIVED\` broadcast receiver used for OTP auto-fill
- [ ] Replace with \`SmsRetriever.startSmsUserConsent()\` or \`SmsCodeRetriever\`
- [ ] Test OTP flow on API 37 emulator — old pattern will be delayed 3 hours

### Large-Screen (extended from API 36)
- [ ] Remove all \`android:screenOrientation\` attributes
- [ ] Remove all \`android:resizeableActivity="false"\` attributes
- [ ] Remove \`android:maxAspectRatio\` restrictions
- [ ] Test on ≥600dp emulator with app rotation (no games exemption at API 37)

### NPU (if applicable)
- [ ] Add \`android.hardware.neural_processing_unit\` feature declaration (optional)
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

  return overview + "\n\n---\n\n" +
    "**Query topics:** 'checklist' (full API 37 migration checklist), " +
    "'static final' (reflection breaking change), " +
    "'local network' (ACCESS_LOCAL_NETWORK permission), " +
    "'sms otp' (3-hour delay migration), " +
    "'npu' (Neural Processing Unit feature declaration), " +
    "'handoff' (cross-device continuity API)\n\n" +
    "Source: https://developer.android.com/about/versions/17";
}
