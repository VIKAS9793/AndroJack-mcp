/**
 * Tool 9 – android_permission_advisor
 *
 * Complete Android permissions reference grounded in official docs:
 * developer.android.com/guide/topics/permissions/overview
 *
 * Covers: normal vs dangerous vs signature permissions, runtime request
 * patterns (API 23+), Play Store restrictions, the correct Compose-based
 * ActivityResultContracts API, and per-permission notes.
 */
import { secureFetch, extractPageText } from "../http.js";
// ── Permission Registry ───────────────────────────────────────────────────────
const PERMISSIONS = {
    // ── Location ───────────────────────────────────────────────────────────────
    ACCESS_FINE_LOCATION: {
        fullName: "android.permission.ACCESS_FINE_LOCATION",
        type: "dangerous", runtimeRequest: true, group: "Location",
        docUrl: "https://developer.android.com/training/location/permissions",
        notes: "On API 31+ the system lets users downgrade to COARSE. Always request COARSE first, then FINE if needed. Never request background + foreground together.",
    },
    ACCESS_COARSE_LOCATION: {
        fullName: "android.permission.ACCESS_COARSE_LOCATION",
        type: "dangerous", runtimeRequest: true, group: "Location",
        docUrl: "https://developer.android.com/training/location/permissions",
        notes: "Prefer over FINE unless GPS precision is genuinely required.",
    },
    ACCESS_BACKGROUND_LOCATION: {
        fullName: "android.permission.ACCESS_BACKGROUND_LOCATION",
        type: "dangerous", runtimeRequest: true, addedApi: 29, group: "Location",
        playRestriction: "RESTRICTED — requires Play Store policy approval. Must show in-app disclosure before requesting. Only navigation, rideshare, family-safety categories normally qualify.",
        docUrl: "https://developer.android.com/training/location/permissions#background",
        notes: "Must be requested separately AFTER foreground location is granted. System takes user to settings on API 30+, not a dialog.",
    },
    // ── Camera / Media ─────────────────────────────────────────────────────────
    CAMERA: {
        fullName: "android.permission.CAMERA",
        type: "dangerous", runtimeRequest: true, group: "Camera",
        docUrl: "https://developer.android.com/training/camera2",
        notes: "Consider Photo Picker (no permission needed) for image selection use cases.",
    },
    READ_MEDIA_IMAGES: {
        fullName: "android.permission.READ_MEDIA_IMAGES",
        type: "dangerous", runtimeRequest: true, addedApi: 33, group: "Storage",
        docUrl: "https://developer.android.com/about/versions/13/behavior-changes-13#granular-media-permissions",
        notes: "Use on API 33+. Below API 33, use READ_EXTERNAL_STORAGE instead.",
    },
    READ_MEDIA_VIDEO: {
        fullName: "android.permission.READ_MEDIA_VIDEO",
        type: "dangerous", runtimeRequest: true, addedApi: 33, group: "Storage",
        docUrl: "https://developer.android.com/about/versions/13/behavior-changes-13#granular-media-permissions",
    },
    READ_MEDIA_AUDIO: {
        fullName: "android.permission.READ_MEDIA_AUDIO",
        type: "dangerous", runtimeRequest: true, addedApi: 33, group: "Storage",
        docUrl: "https://developer.android.com/about/versions/13/behavior-changes-13#granular-media-permissions",
    },
    READ_EXTERNAL_STORAGE: {
        fullName: "android.permission.READ_EXTERNAL_STORAGE",
        type: "dangerous", runtimeRequest: true, group: "Storage",
        deprecatedOrRemovedApi: 33,
        replacement: "READ_MEDIA_IMAGES / READ_MEDIA_VIDEO / READ_MEDIA_AUDIO on API 33+",
        docUrl: "https://developer.android.com/training/data-storage",
    },
    WRITE_EXTERNAL_STORAGE: {
        fullName: "android.permission.WRITE_EXTERNAL_STORAGE",
        type: "removed", runtimeRequest: false,
        deprecatedOrRemovedApi: 29,
        replacement: "Scoped Storage via MediaStore API or Storage Access Framework (SAF)",
        docUrl: "https://developer.android.com/training/data-storage/shared/media",
        notes: "Ignored on API 29+. Do NOT request this in new apps.",
    },
    MANAGE_EXTERNAL_STORAGE: {
        fullName: "android.permission.MANAGE_EXTERNAL_STORAGE",
        type: "special", runtimeRequest: true, addedApi: 30,
        playRestriction: "HEAVILY RESTRICTED — Play Store only allows file manager, antivirus, backup apps. Requires declaration form and policy approval.",
        docUrl: "https://developer.android.com/training/data-storage/manage-all-files",
        notes: "Sends user to Special App Access settings. Use Scoped Storage instead.",
    },
    // ── Notifications ──────────────────────────────────────────────────────────
    POST_NOTIFICATIONS: {
        fullName: "android.permission.POST_NOTIFICATIONS",
        type: "dangerous", runtimeRequest: true, addedApi: 33, group: "Notifications",
        docUrl: "https://developer.android.com/develop/ui/views/notifications/notification-permission",
        notes: "Auto-granted for apps targeting API <33. Request contextually — not on launch. Create a NotificationChannel first (required API 26+).",
    },
    // ── Microphone ─────────────────────────────────────────────────────────────
    RECORD_AUDIO: {
        fullName: "android.permission.RECORD_AUDIO",
        type: "dangerous", runtimeRequest: true, group: "Microphone",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#RECORD_AUDIO",
        notes: "Shows microphone indicator in status bar while active (API 30+).",
    },
    // ── Bluetooth ──────────────────────────────────────────────────────────────
    BLUETOOTH_SCAN: {
        fullName: "android.permission.BLUETOOTH_SCAN",
        type: "dangerous", runtimeRequest: true, addedApi: 31, group: "Bluetooth",
        docUrl: "https://developer.android.com/guide/topics/connectivity/bluetooth/permissions",
        notes: "If scanning for devices NOT using location, add android:usesPermissionFlags='neverForLocation' to avoid triggering location rationale.",
    },
    BLUETOOTH_CONNECT: {
        fullName: "android.permission.BLUETOOTH_CONNECT",
        type: "dangerous", runtimeRequest: true, addedApi: 31, group: "Bluetooth",
        docUrl: "https://developer.android.com/guide/topics/connectivity/bluetooth/permissions",
    },
    BLUETOOTH_ADVERTISE: {
        fullName: "android.permission.BLUETOOTH_ADVERTISE",
        type: "dangerous", runtimeRequest: true, addedApi: 31, group: "Bluetooth",
        docUrl: "https://developer.android.com/guide/topics/connectivity/bluetooth/permissions",
    },
    // ── Internet / Network ─────────────────────────────────────────────────────
    INTERNET: {
        fullName: "android.permission.INTERNET",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#INTERNET",
        notes: "Normal permission — auto-granted at install. No runtime request needed.",
    },
    ACCESS_NETWORK_STATE: {
        fullName: "android.permission.ACCESS_NETWORK_STATE",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#ACCESS_NETWORK_STATE",
    },
    ACCESS_WIFI_STATE: {
        fullName: "android.permission.ACCESS_WIFI_STATE",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#ACCESS_WIFI_STATE",
    },
    // ── Contacts ───────────────────────────────────────────────────────────────
    READ_CONTACTS: {
        fullName: "android.permission.READ_CONTACTS",
        type: "dangerous", runtimeRequest: true, group: "Contacts",
        docUrl: "https://developer.android.com/training/contacts-provider",
    },
    WRITE_CONTACTS: {
        fullName: "android.permission.WRITE_CONTACTS",
        type: "dangerous", runtimeRequest: true, group: "Contacts",
        docUrl: "https://developer.android.com/training/contacts-provider",
    },
    // ── Phone / SMS ────────────────────────────────────────────────────────────
    READ_PHONE_STATE: {
        fullName: "android.permission.READ_PHONE_STATE",
        type: "dangerous", runtimeRequest: true, group: "Phone",
        playRestriction: "Restricted. Avoid unless app is a dialer/phone app. Justify use in Play Console.",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#READ_PHONE_STATE",
    },
    CALL_PHONE: {
        fullName: "android.permission.CALL_PHONE",
        type: "dangerous", runtimeRequest: true, group: "Phone",
        playRestriction: "Core phone or VoIP apps only.",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#CALL_PHONE",
    },
    SEND_SMS: {
        fullName: "android.permission.SEND_SMS",
        type: "dangerous", runtimeRequest: true, group: "SMS",
        playRestriction: "Default SMS apps only. Play Store requires declaration.",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#SEND_SMS",
    },
    READ_SMS: {
        fullName: "android.permission.READ_SMS",
        type: "dangerous", runtimeRequest: true, group: "SMS",
        playRestriction: "Default SMS apps only. Heavily restricted.",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#READ_SMS",
    },
    // ── Background / Battery ───────────────────────────────────────────────────
    REQUEST_IGNORE_BATTERY_OPTIMIZATIONS: {
        fullName: "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
        type: "special", runtimeRequest: true,
        playRestriction: "RESTRICTED — allowed only for VoIP, health monitoring, device management. Must submit declaration to Play Store.",
        docUrl: "https://developer.android.com/training/monitoring-device-state/doze-standby#support_for_other_use_cases",
        notes: "Prefer WorkManager with appropriate constraints instead.",
    },
    SCHEDULE_EXACT_ALARM: {
        fullName: "android.permission.SCHEDULE_EXACT_ALARM",
        type: "special", runtimeRequest: true, addedApi: 31,
        playRestriction: "Calendar and alarm apps only. Justify to Play Store.",
        docUrl: "https://developer.android.com/training/scheduling/alarms",
        notes: "Use inexact alarms or WorkManager for non-user-visible timing.",
    },
    USE_EXACT_ALARM: {
        fullName: "android.permission.USE_EXACT_ALARM",
        type: "normal", runtimeRequest: false, addedApi: 33,
        docUrl: "https://developer.android.com/training/scheduling/alarms",
        notes: "Auto-granted for alarm/clock/calendar apps only. Others use SCHEDULE_EXACT_ALARM.",
    },
    // ── Biometrics ────────────────────────────────────────────────────────────
    USE_BIOMETRIC: {
        fullName: "android.permission.USE_BIOMETRIC",
        type: "normal", runtimeRequest: false, addedApi: 28,
        docUrl: "https://developer.android.com/training/sign-in/biometric-auth",
        notes: "Normal permission — auto-granted. Use BiometricPrompt API, not FingerprintManager (deprecated).",
    },
    USE_FINGERPRINT: {
        fullName: "android.permission.USE_FINGERPRINT",
        type: "normal", runtimeRequest: false,
        deprecatedOrRemovedApi: 28,
        replacement: "USE_BIOMETRIC + BiometricPrompt",
        docUrl: "https://developer.android.com/training/sign-in/biometric-auth",
    },
    // ── Overlay ───────────────────────────────────────────────────────────────
    SYSTEM_ALERT_WINDOW: {
        fullName: "android.permission.SYSTEM_ALERT_WINDOW",
        type: "special", runtimeRequest: true,
        playRestriction: "Restricted. Sends user to Special App Access. Justify in Play Console. Only for accessibility, call apps, floating widgets.",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW",
        notes: "Check Settings.canDrawOverlays(context) before attempting to use.",
    },
    // ── Health ────────────────────────────────────────────────────────────────
    ACTIVITY_RECOGNITION: {
        fullName: "android.permission.ACTIVITY_RECOGNITION",
        type: "dangerous", runtimeRequest: true, addedApi: 29, group: "Activity",
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#ACTIVITY_RECOGNITION",
    },
    // ── NFC ───────────────────────────────────────────────────────────────────
    NFC: {
        fullName: "android.permission.NFC",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/guide/topics/connectivity/nfc/nfc",
    },
    // ── Vibrate / Wake ─────────────────────────────────────────────────────────
    VIBRATE: {
        fullName: "android.permission.VIBRATE",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#VIBRATE",
    },
    WAKE_LOCK: {
        fullName: "android.permission.WAKE_LOCK",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/training/scheduling/wakelock",
        notes: "Prefer WorkManager over manual wake locks for background work.",
    },
    FOREGROUND_SERVICE: {
        fullName: "android.permission.FOREGROUND_SERVICE",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/develop/background-work/services/foreground-services",
        notes: "On API 34+ you must also declare FOREGROUND_SERVICE_<type> (e.g. FOREGROUND_SERVICE_LOCATION).",
    },
    FOREGROUND_SERVICE_LOCATION: {
        fullName: "android.permission.FOREGROUND_SERVICE_LOCATION",
        type: "normal", runtimeRequest: false, addedApi: 34,
        docUrl: "https://developer.android.com/develop/background-work/services/fg-service-types",
    },
    RECEIVE_BOOT_COMPLETED: {
        fullName: "android.permission.RECEIVE_BOOT_COMPLETED",
        type: "normal", runtimeRequest: false,
        docUrl: "https://developer.android.com/reference/android/Manifest.permission#RECEIVE_BOOT_COMPLETED",
        notes: "Declare in manifest. Use WorkManager with PERSIST_ACROSS_REBOOTS for deferrable tasks.",
    },
};
// ── Patterns ─────────────────────────────────────────────────────────────────
const RUNTIME_REQUEST_PATTERN = `
## Runtime Permission Request Pattern (Modern — ActivityResultContracts)

\`\`\`kotlin
// Source: developer.android.com/training/permissions/requesting

// Single permission
val requestPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted ->
    if (isGranted) {
        // Permission granted — proceed
    } else {
        // Show rationale or gracefully degrade
    }
}

// Multiple permissions
val requestMultipleLauncher = registerForActivityResult(
    ActivityResultContracts.RequestMultiplePermissions()
) { permissions ->
    val cameraGranted = permissions[Manifest.permission.CAMERA] == true
    val micGranted = permissions[Manifest.permission.RECORD_AUDIO] == true
}

// Triggering the request
fun requestCameraPermission() {
    when {
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED -> {
            // Already granted
        }
        shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
            // Show rationale UI, then request
            showRationale { requestPermissionLauncher.launch(Manifest.permission.CAMERA) }
        }
        else -> requestPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
}
\`\`\`

### In Jetpack Compose — use Accompanist or rememberLauncherForActivityResult
\`\`\`kotlin
@Composable
fun CameraFeature() {
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) { /* show rationale */ }
    }

    val context = LocalContext.current
    val hasPermission = ContextCompat.checkSelfPermission(
        context, Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_GRANTED

    if (hasPermission) {
        CameraPreview()
    } else {
        Button(onClick = { launcher.launch(Manifest.permission.CAMERA) }) {
            Text("Enable Camera")
        }
    }
}
\`\`\`

### Anti-patterns
| ❌ Don't | ✅ Do Instead |
|---------|-------------|
| Request all permissions at startup | Request only when the feature is invoked |
| Use \`onRequestPermissionsResult\` override | Use \`ActivityResultContracts\` |
| Ignore \`shouldShowRequestPermissionRationale\` | Always check and show rationale |
| Request foreground + background together | Request foreground first, background later |
| Crash when permission denied | Gracefully degrade UI |
`;
// ── Lookup helpers ────────────────────────────────────────────────────────────
function findPermission(query) {
    const q = query.toUpperCase().replace(/^android\.permission\./i, "").replace(/\s+/g, "_");
    for (const [key, entry] of Object.entries(PERMISSIONS)) {
        if (key.toUpperCase() === q)
            return [key, entry];
    }
    for (const [key, entry] of Object.entries(PERMISSIONS)) {
        if (key.toUpperCase().includes(q) || q.includes(key.toUpperCase()))
            return [key, entry];
    }
    return null;
}
function formatEntry(key, entry) {
    const emoji = {
        normal: "🟢", dangerous: "🔴", signature: "🔒", special: "🟠", removed: "❌"
    };
    return [
        `## Permission: \`${entry.fullName}\``,
        `**Type:** ${emoji[entry.type]} ${entry.type.toUpperCase()}`,
        `**Runtime Request Required:** ${entry.runtimeRequest ? "✅ Yes (API 23+)" : "❌ No — install-time grant"}`,
        entry.group ? `**Permission Group:** ${entry.group}` : "",
        entry.addedApi ? `**Added:** API ${entry.addedApi}` : "",
        entry.deprecatedOrRemovedApi ? `**⚠️ Deprecated/Removed:** API ${entry.deprecatedOrRemovedApi}` : "",
        entry.replacement ? `**Use Instead:** ${entry.replacement}` : "",
        entry.playRestriction ? `\n**🏪 Play Store:** ⚠️ ${entry.playRestriction}` : "",
        `**Official Docs:** ${entry.docUrl}`,
        entry.notes ? `**Notes:** ${entry.notes}` : "",
        "",
        entry.type === "removed"
            ? `> ❌ GROUNDING GATE: Do NOT use this permission. Use: ${entry.replacement ?? "see docs"}.`
            : entry.type === "special"
                ? `> 🟠 GROUNDING GATE: Special permission — sends user to Settings. Ensure genuine use case before requesting.`
                : entry.runtimeRequest
                    ? `> 🔴 GROUNDING GATE: Runtime permission — use ActivityResultContracts.RequestPermission().`
                    : `> 🟢 GROUNDING GATE: Normal permission — declare in AndroidManifest.xml, no runtime request needed.`,
    ].filter(Boolean).join("\n");
}
const INDEX = `
## Android Permission Advisor

**Query a specific permission** — pass the name (e.g. "CAMERA", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS")
**Query "runtime pattern"** — see the official ActivityResultContracts request pattern
**Query "list"** — see all permissions in registry

### Permission Types Quick Reference
| Type | Risk | Granted By |
|------|------|-----------|
| 🟢 Normal | Low | Auto at install |
| 🔴 Dangerous | High | Runtime dialog (API 23+) |
| 🔒 Signature | App-to-app | Auto if same certificate |
| 🟠 Special | System-level | User navigates to Settings |
| ❌ Removed | N/A | Do not use |

**Official reference:** https://developer.android.com/guide/topics/permissions/overview
`;
// ── Main handler ──────────────────────────────────────────────────────────────
export async function androidPermissionAdvisor(query) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.toLowerCase() === "list") {
        const list = Object.entries(PERMISSIONS)
            .map(([k, v]) => `- \`${k}\` — ${v.type}${v.runtimeRequest ? " (runtime)" : ""}`)
            .join("\n");
        return INDEX + `\n### Registry (${Object.keys(PERMISSIONS).length} permissions)\n` + list;
    }
    if (trimmed.toLowerCase().includes("runtime pattern") || trimmed.toLowerCase().includes("how to request")) {
        return RUNTIME_REQUEST_PATTERN + `\n\n**Official guide:** https://developer.android.com/training/permissions/requesting`;
    }
    const found = findPermission(trimmed);
    if (found)
        return formatEntry(found[0], found[1]);
    // Live fallback
    const url = `https://developer.android.com/s/results?q=${encodeURIComponent("android permission " + trimmed)}`;
    try {
        const html = await secureFetch(url);
        return `## Permission: "${trimmed}"\n\nNot in registry. Live search from developer.android.com:\n\n${extractPageText(html, 1500)}\n\n**Search URL:** ${url}`;
    }
    catch {
        return `## Permission: "${trimmed}"\n\nNot in registry. Check manually:\nhttps://developer.android.com/reference/android/Manifest.permission\nhttps://developer.android.com/guide/topics/permissions/overview`;
    }
}
