// Tool 23: Android Developer Verification Program Advisor
//
// Google introduced Android developer verification in 2025 and rolled it out
// to all developers on Play Console and the new Android Developer Console in
// March 2026. Enforcement begins September 30, 2026 in Brazil, Indonesia,
// Singapore, and Thailand, expanding globally in 2027. This is one of the
// most significant changes to Android app distribution in years — every
// developer, not just Play Store publishers, is affected.
//
// Sources:
// https://android-developers.googleblog.com/2026/06/android-developer-verification.html
// https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html
// https://support.google.com/android-developer-console/answer/16561738

export async function androidDeveloperVerification(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  const overview = `
# Android Developer Verification Program
Source: https://android-developers.googleblog.com/2026/06/android-developer-verification.html

## What This Is

Starting September 30, 2026, only apps registered by a verified developer can
be installed and updated on certified Android devices — initially in Brazil,
Indonesia, Singapore, and Thailand, expanding globally in 2027. This applies
to Google Play **and** participating third-party stores (Samsung Galaxy
Store, Xiaomi GetApps, HONOR App Market, OPPO App Market, vivo V-Appstore,
Palm Store).

This is an identity check, not a content review: Google verifies **who the
developer is**, not what the app does. Sideloading itself is not being
removed — unregistered apps can still be installed via ADB or a new
"advanced flow" with extra security checkpoints designed to resist coercion
scams.

## Why This Affects You Even If You Don't Publish on Play Store

If you distribute an APK by any channel — direct download, a third-party
store, an internal enterprise channel outside a managed device fleet — the
same registration requirement applies from the enforcement date in the
initial four countries, and globally from 2027. Enterprise apps distributed
only through an organization's managed-device store are exempt, since the
IT admin has already vetted them.

## Timeline (verified against official sources)

| Date | Milestone |
|------|-----------|
| March 2026 | Verification rolled out to all developers via Play Console and the new Android Developer Console |
| April 2026 | "Android Developer Verifier" system service begins installing on devices |
| June 2026 | Early access: limited-distribution accounts for students/hobbyists |
| July 2026 | Android Developer ID Status API launches globally; early access to Android Developer Console API |
| August 2026 | Limited-distribution accounts launch globally; advanced sideloading flow launches globally |
| **September 30, 2026** | **Enforcement begins** — Brazil, Indonesia, Singapore, Thailand |
| 2027 and beyond | Global expansion to all certified Android devices |

## Do I Need to Do Anything Right Now?

**If you're on Google Play:** most Play developers are already verified —
over 99% of apps have been registered automatically. Check your Play
Console home page for your app's verification status.

**If you distribute only outside Google Play:** sign up for the new Android
Developer Console today and register your package names.

**If you're a student, hobbyist, or building for a closed group:** a new
limited-distribution account type launches — no government-issued ID or fee
required, apps shareable to up to 20 devices.
`;

  const timeline = overview.slice(
    overview.indexOf("## Timeline"),
    overview.indexOf("## Do I Need")
  );

  const registration = `
# Android Developer Verification — Registration Steps
Source: https://support.google.com/android-developer-console/answer/16561738

## Path 1 — Already on Google Play

1. Open **Play Console** → Home page
2. Check your app's verification status banner
3. If already verified: no action needed, your eligible apps auto-registered
4. If an app **cannot** be auto-registered: follow the manual app claim
   process shown in Play Console
5. **Android Studio integration:** registration status now shows directly
   in the IDE when you generate a signed App Bundle or APK

## Path 2 — Distributing Only Outside Google Play

1. Sign up for the **Android Developer Console** (separate from Play Console)
2. Verify your identity (government-issued ID, or use a limited-distribution
   account if you qualify as a student/hobbyist)
3. Register each package name you distribute
4. Use the **Android Developer ID Status API** to check if a package name is
   already registered before you register it again

## Path 3 — Bulk Registration via CI/CD

Google is launching developer-requested APIs specifically for teams managing
many apps or automated release pipelines:

- **Android Developer ID Status API** — check if a package name is already
  registered (global launch: July 2026)
- **Android Developer Console API** — register and manage package names
  directly from your development environment / CI pipeline (early access:
  July 2026, global: August 2026)

\`\`\`bash
# Conceptual CI/CD integration — confirm exact request format with
# android_official_search once the API reaches general availability,
# since the payload schema was not finalized at time of writing.
curl -X POST "https://developerconsole.googleapis.com/v1/apps:register" \\
  -H "Authorization: Bearer \$ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"packageName": "com.example.app", "developerId": "YOUR_VERIFIED_ID"}'
\`\`\`

## Path 4 — Limited-Distribution Account (Students / Hobbyists)

- No government-issued ID required
- No developer fee
- Apps shareable to **up to 20 devices**
- Early access: June 2026 · Global: August 2026
- Ideal for coursework, portfolio apps, closed friend/family testing
`;

  const enterprise = `
# Android Developer Verification — Enterprise & Managed Devices
Source: https://support.google.com/android-developer-console/answer/16561738

## Do Enterprise Apps Need Verification?

**No, with a condition.** Apps distributed through your organization's own
store, installed only on devices managed by your organization's IT admin,
are exempt — the admin has already vetted the app for safety and security.

## When Enterprise Apps DO Need Registration

If your app might ever be:
- Distributed outside the managed store
- Installed on a non-managed device (BYOD scenarios, contractor devices)
- Shared with an external partner organization

Google's own recommendation: **register and claim the app anyway**, even if
your primary distribution is managed-device-only. This avoids a scramble
later if distribution scope changes.

## Advanced Sideloading Flow (Power Users)

For unregistered apps, Google is not removing sideloading — it added
friction, not a wall:

- ADB installation continues to work unchanged
- A new "advanced flow" allows installing unregistered apps directly, with
  extra security checkpoints specifically designed to resist coercion and
  scam scenarios (e.g., a scammer walking a victim through disabling
  protections over a phone call)
- Global launch: August 2026
`;

  const studioIntegration = `
# Android Developer Verification — Android Studio Integration
Source: https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html

## What Changes in the IDE

Android Studio developers now see their app's registration status directly
in the IDE when generating a signed App Bundle (AAB) or APK. This surfaces
verification problems at build time rather than at Play Console upload time
or — worse — after a user reports install failures.

## What to Check Before Release Builds

- [ ] Confirm registration status shows as verified in Android Studio's
      signing/build dialog before generating a release AAB/APK
- [ ] If distributing outside Google Play, confirm the package name is
      registered via the Android Developer Console (or the ID Status API
      once generally available)
- [ ] For CI/CD pipelines producing release builds, add a pre-flight check
      against the Android Developer ID Status API once it reaches general
      availability (July 2026 per the published timeline)
- [ ] For apps also distributed via a non-Play third-party store, confirm
      that store is one of the participating stores enforcing verification
      (Samsung Galaxy Store, Xiaomi GetApps, HONOR App Market, OPPO App
      Market, vivo V-Appstore, Palm Store) and register there as required
`;

  if (t.includes("timeline") || t.includes("date") || t.includes("when") || t.includes("deadline")) {
    return timeline + "\n\nSource: https://android-developers.googleblog.com/2026/06/android-developer-verification.html";
  }
  if (t.includes("register") || t.includes("registration") || t.includes("how do i") || t.includes("ci/cd") || t.includes("api") || t.includes("bulk")) {
    return registration;
  }
  if (t.includes("enterprise") || t.includes("managed") || t.includes("sideload") || t.includes("advanced flow") || t.includes("byod")) {
    return enterprise;
  }
  if (t.includes("studio") || t.includes("ide") || t.includes("build") || t.includes("signed") || t.includes("aab")) {
    return studioIntegration;
  }

  return overview + "\n\n---\n\n" +
    "**Query topics:** 'timeline' (full rollout dates), " +
    "'registration' (how to register — Play Console, Developer Console, CI/CD), " +
    "'enterprise' (managed devices, sideloading, advanced flow), " +
    "'studio' (Android Studio IDE integration)\n\n" +
    "Source: https://android-developers.googleblog.com/2026/06/android-developer-verification.html";
}
