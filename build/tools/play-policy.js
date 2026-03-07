// Tool 18: Play Store Policy Advisor
// October 2025 policy changes affect app code, architecture, and manifest declarations.
// AI tools have zero awareness of these changes. Review failures cost weeks of re-submission.
export async function androidPlayPolicyAdvisor(topic) {
    const t = topic.toLowerCase().trim();
    const overview = `
# Google Play Store Policy Reference (2025–2026)
Source: https://support.google.com/googleplay/android-developer/answer/9904549

## Most Recent Policy Changes (October 2025 Enforcement Start)

| Policy | Effective | Who's Affected |
|--------|-----------|---------------|
| Restrict Minor Access API | Oct 2025 | Dating, gambling, real-money gaming apps |
| Medical Device labeling (EU) | Oct 2025 | Health/medical apps in European markets |
| Digital Lending compliance (India) | Oct 2025 | Personal loan apps in India |
| Subscription charge transparency | Oct 2025 | All apps with subscriptions |
| API 36 targeting mandate | Aug 2026 | ALL apps — large-screen compliance |
| Large-screen quality badge | Active | All apps — affects search placement |

## API 36 Targeting Mandate (August 2026)

Every app published on Google Play must target API 36 by August 2026. This means:
- minSdk can remain at 21+ (no change to minimum)
- targetSdk must be 36
- Apps MUST handle all screen sizes, aspect ratios, and multi-window on ≥600dp devices
- Apps MUST support Predictive Back Gesture

See the android_api36_compliance tool for the full technical implementation guide.

Source: https://support.google.com/googleplay/android-developer/answer/9904549
`;
    const restrictMinorAccess = `
# Play Store Policy — Restrict Minor Access (October 2025)
Source: https://support.google.com/googleplay/android-developer/answer/14191470

## Who This Affects
Apps in these categories on Google Play:
- Dating apps
- Gambling and casino apps
- Real-money games
- Apps containing mature content

## What's Required — Code Implementation

Apps must implement the "Restrict Minor Access" feature. This is NOT just a content rating.
It requires a specific API integration with Google Play's Family Policy system.

\`\`\`kotlin
// Implementation uses Play Core Family APIs
// Check the current official docs for latest SDK version
// https://developer.android.com/google/play/billing/families

// Manifest — declare the feature
<meta-data
  android:name="com.google.android.gms.version"
  android:value="@integer/google_play_services_version" />

// In your app, check parental controls status before showing restricted content
class AgeVerificationRepository @Inject constructor(
  private val context: Context
) {
  fun isRestrictedContentAllowed(): Flow<Boolean> = callbackFlow {
    // Integrate with Google Play Family APIs
    // Implementation details depend on your app category
    // Reference: https://developer.android.com/google/play/billing/families
    trySend(true)  // Default — replace with actual implementation
    awaitClose()
  }
}
\`\`\`

## What Happens If You Don't Comply
Apps that don't implement this in affected categories will be removed from Play Store
for the applicable markets where enforcement is active.

Source: https://support.google.com/googleplay/android-developer/answer/14191470
`;
    const subscriptions = `
# Play Store Policy — Subscription Transparency (2025)
Source: https://support.google.com/googleplay/android-developer/answer/140504

## What's Required

All subscription purchase screens must:
1. Clearly display the **total charge** before the free trial ends (if applicable)
2. Show the **recurring billing amount and frequency** prominently
3. Include a **cancellation mechanism** accessible within the app (not just email/web)
4. Not obscure prices with dark patterns

## Implementation Checklist

\`\`\`kotlin
// ✅ Use Play Billing Library 7+ for subscription management
// libs.versions.toml
[versions]
billing = "7.1.1"

[libraries]
billing = { group = "com.android.billingclient", name = "billing-ktx", version.ref = "billing" }

// ✅ Display full price prominently using ProductDetails
fun displaySubscriptionDetails(productDetails: ProductDetails) {
  val subscriptionOffer = productDetails.subscriptionOfferDetails?.firstOrNull()
  val pricingPhase = subscriptionOffer?.pricingPhases?.pricingPhaseList?.lastOrNull()

  // Show: formattedPrice + "/" + billingPeriod
  // e.g. "$9.99/month" — NOT just "$9.99"
  val billingPeriod = pricingPhase?.billingPeriod // ISO 8601: P1M = 1 month, P1Y = 1 year
  val price = pricingPhase?.formattedPrice

  // ✅ Required text: "You will be charged $price per [period] until you cancel"
}

// ✅ In-app subscription management (required — not just deep link to Play)
fun openSubscriptionManagement(context: Context) {
  // Must be accessible in-app, not just via Play Store URL
  val intent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse("https://play.google.com/store/account/subscriptions")
  }
  context.startActivity(intent)
  // OR implement a native in-app subscription management screen
}
\`\`\`

Source: https://support.google.com/googleplay/android-developer/answer/140504
`;
    const permissions = `
# Play Store Policy — Permissions & Data Safety (2025)
Source: https://support.google.com/googleplay/android-developer/answer/10787469

## Data Safety Section — Required Declarations

Every app on Play Store must accurately declare in the Data Safety section:
- What data is collected
- Whether data is shared with third parties
- Whether data is encrypted in transit and at rest
- Whether users can request data deletion

**Non-disclosure = policy violation.** Review the Data Safety form annually as your
app's data practices evolve.

## Restricted Permissions — Still Requiring Justification in 2026

These permissions require a declaration of purpose and may be rejected at review:

| Permission | Restriction | Alternative |
|-----------|-------------|-------------|
| READ_CALL_LOG | High restriction | Use CallScreeningService for screening only |
| PROCESS_OUTGOING_CALLS | High restriction | Deprecated — use CallRedirectionService |
| MANAGE_EXTERNAL_STORAGE | High restriction | Use MediaStore or SAF (Storage Access Framework) |
| ACCESS_BACKGROUND_LOCATION | High restriction | Must justify in console — prefer foreground only |
| READ_CONTACTS (bulk export) | Medium restriction | Request individual contacts via ContactsContract |
| SYSTEM_ALERT_WINDOW | Medium restriction | Use overlay only for documented use cases |

## SMS & Call Log Policies

Apps that are NOT the default SMS app, default dialer, or device/profile owner CANNOT use:
- READ_SMS, RECEIVE_SMS, READ_CALL_LOG, WRITE_CALL_LOG, PROCESS_OUTGOING_CALLS

If your app requests these and is not the default handler, it will be rejected.

Source: https://support.google.com/googleplay/android-developer/answer/10787469
`;
    const largeScreenQuality = `
# Play Store — Large-Screen Quality Program (Direct Revenue Impact)
Source: https://developer.android.com/docs/quality-guidelines/large-screen-app-quality

## Why This Matters for Business

Google Play actively promotes adaptive apps and demotes non-compliant ones:
- Apps that FAIL large-screen checks receive a visible warning badge on their Play listing
- Warning badges are a direct conversion-rate deterrent — users see it before downloading
- Apps that PASS quality checks are eligible for Editorial promotion and search boosts
- Tablet + phone users spend 9× more on apps. Foldable users spend 14× more.

## The Three Tiers — What Each Unlocks

### Tier 3: Large Screen Ready (Required to avoid warning badge)
Shows badge: "Designed for tablets" — minimum bar
- No orientation/resizability locks
- Handles configuration changes without crashes
- Basic keyboard/mouse support

### Tier 2: Large Screen Optimized
Eligible for "Optimized for large screens" badge
- Adaptive layouts with WindowSizeClass
- No content clipped in any window size or orientation

### Tier 1: Large Screen Differentiated
Eligible for Editors' Choice and app features
- Multi-pane layouts
- Drag-and-drop
- Foldable hinge awareness

## Checking Your App's Quality Tier

In Google Play Console:
1. Go to **Android vitals** → **App compatibility** → **Large screens**
2. Review the automated checks and their pass/fail status
3. Fix failing checks using the android_large_screen_guide and android_api36_compliance tools

Source: https://developer.android.com/docs/quality-guidelines/large-screen-app-quality
`;
    if (t.includes("minor") || t.includes("restrict") || t.includes("age") || t.includes("dating") || t.includes("gambling")) {
        return restrictMinorAccess;
    }
    if (t.includes("subscri") || t.includes("billing") || t.includes("payment")) {
        return subscriptions;
    }
    if (t.includes("permission") || t.includes("data safety") || t.includes("sms") || t.includes("call log")) {
        return permissions;
    }
    if (t.includes("large screen") || t.includes("tablet") || t.includes("quality") || t.includes("badge")) {
        return largeScreenQuality;
    }
    return overview + "\n\n---\n\n" +
        "**Query topics:** 'restrict minor access' (dating/gambling apps), 'subscriptions' (billing transparency), " +
        "'permissions' (restricted permissions + data safety), 'large screen quality' (Play Store badge + revenue impact)\n\n" +
        "Source: https://support.google.com/googleplay/android-developer/";
}
