import test from 'node:test';
import assert from 'node:assert';
import { runRules, detectLanguage } from '../build/rules/android-rules.js';

test('detectLanguage - heuristics', () => {
  assert.strictEqual(detectLanguage('fun main() {}'), 'kotlin');
  assert.strictEqual(detectLanguage('<?xml version="1.0"?>'), 'xml');
  assert.strictEqual(detectLanguage('dependencies { implementation("...") }'), 'gradle');
  assert.strictEqual(detectLanguage('some random text'), 'unknown');
});

test('Rule: REMOVED_ASYNCTASK', () => {
  const code = 'class MyTask : AsyncTask<Void, Void, Void>() {}';
  const violations = runRules(code, { language: 'kotlin' });
  assert.ok(violations.some(v => v.ruleId === 'REMOVED_ASYNCTASK'));
  
  const cleanCode = 'class MyTask : CoroutineScope by MainScope() {}';
  const cleanViolations = runRules(cleanCode, { language: 'kotlin' });
  assert.ok(!cleanViolations.some(v => v.ruleId === 'REMOVED_ASYNCTASK'));
});

test('Rule: GLOBALSCOPE_LAUNCH', () => {
  const code = 'GlobalScope.launch { }';
  const violations = runRules(code, { language: 'kotlin' });
  assert.ok(violations.some(v => v.ruleId === 'GLOBALSCOPE_LAUNCH'));
});

test('Rule: XML_SCREEN_ORIENTATION_LOCK', () => {
  const code = '<activity android:name=".MainActivity" android:screenOrientation="portrait" />';
  // minSdkAbove: 29, so we need targetSdk > 29
  const violations = runRules(code, { language: 'xml', targetSdk: 36 });
  assert.ok(violations.some(v => v.ruleId === 'XML_SCREEN_ORIENTATION_LOCK'));
  
  const ignoredViolations = runRules(code, { language: 'xml', targetSdk: 28 });
  assert.ok(!ignoredViolations.some(v => v.ruleId === 'XML_SCREEN_ORIENTATION_LOCK'));
});

test('Rule: API37_STATIC_FINAL_REFLECTION', () => {
  const code = 'field.isAccessible = true';
  // minSdkAbove: 35
  const violations = runRules(code, { language: 'kotlin', targetSdk: 37 });
  assert.ok(violations.some(v => v.ruleId === 'API37_STATIC_FINAL_REFLECTION'));
  
  const ignoredViolations = runRules(code, { language: 'kotlin', targetSdk: 35 });
  assert.ok(!ignoredViolations.some(v => v.ruleId === 'API37_STATIC_FINAL_REFLECTION'));
});

// Helper to test all rules
const allRules = [
  { id: 'REMOVED_ASYNCTASK', lang: 'kotlin', fail: 'import android.os.AsyncTask', pass: 'import kotlinx.coroutines.*' },
  { id: 'REMOVED_TEST_COROUTINE_DISPATCHER', lang: 'kotlin', fail: 'val d = TestCoroutineDispatcher()', pass: 'val d = StandardTestDispatcher()' },
  { id: 'REMOVED_TEST_COROUTINE_SCOPE', lang: 'kotlin', fail: 'val s = TestCoroutineScope()', pass: 'runTest { }' },
  { id: 'GLOBALSCOPE_ASYNC', lang: 'kotlin', fail: 'GlobalScope.async { }', pass: 'viewModelScope.async { }' },
  { id: 'XML_RESIZE_DISABLED', lang: 'xml', fail: 'android:resizeableActivity="false"', pass: 'android:resizeableActivity="true"' },
  { id: 'RUNBLOCKING_UI', lang: 'kotlin', fail: 'runBlocking { }', pass: 'launch { }' },
  { id: 'THREAD_SLEEP_IN_TEST', lang: 'kotlin', fail: 'Thread.sleep(1000)', pass: 'delay(1000)' },
  { id: 'START_ACTIVITY_FOR_RESULT', lang: 'kotlin', fail: 'activity.startActivityForResult(intent, 1)', pass: 'launcher.launch(intent)' },
  { id: 'DEPRECATED_CONTEXTUAL_FLOW_ROW', lang: 'kotlin', fail: 'ContextualFlowRow { }', pass: 'FlowRow { }' },
  { id: 'DEPRECATED_CONTEXTUAL_FLOW_COLUMN', lang: 'kotlin', fail: 'ContextualFlowColumn { }', pass: 'FlowColumn { }' },
  { id: 'DEPRECATED_NAV_CONTROLLER_NEW_CODE', lang: 'kotlin', fail: 'rememberNavController()', pass: 'rememberNavBackStack()' },
  { id: 'DEPRECATED_NAV_HOST', lang: 'kotlin', fail: 'NavHost(navController) { }', pass: 'NavDisplay(backstack) { }' },
  { id: 'DEPRECATED_INTENTSERVICE', lang: 'kotlin', fail: 'class MyService : IntentService("MyService")', pass: 'class MyWorker : Worker(...)' },
  { id: 'DEPRECATED_HANDLER_THREAD', lang: 'kotlin', fail: 'val t = HandlerThread("name")', pass: 'val d = Dispatchers.Default' },
  { id: 'DEPRECATED_SHARED_PREFERENCES', lang: 'kotlin', fail: 'context.getSharedPreferences("x", 0)', pass: 'context.dataStore' },
  { id: 'DEPRECATED_LIVEDATA_NEW_CODE', lang: 'kotlin', fail: 'val ld = MutableLiveData<String>()', pass: 'val sf = MutableStateFlow("")' },
  { id: 'DEPRECATED_BOTTOM_APP_BAR_M3E', lang: 'kotlin', fail: 'BottomAppBar { }', pass: 'DockedToolbar { }' },
  { id: 'GRADLE_KAPT_NEW_PROJECT', lang: 'gradle', fail: 'apply plugin: "kotlin-kapt"', pass: 'apply plugin: "com.google.devtools.ksp"' },
  { id: 'DEPRECATED_ACCOUNT_MANAGER', lang: 'kotlin', fail: 'AccountManager.get(context)', pass: 'CredentialManager.create(context)' },
  { id: 'INFO_HARDCODED_DISPATCH_MAIN', lang: 'kotlin', fail: 'Dispatchers.Main', pass: 'mainDispatcher' },
  { id: 'INFO_GRADLE_HARDCODED_VERSION', lang: 'gradle', fail: 'implementation("group:artifact:1.0.0")', pass: 'implementation(libs.myLib)' },
  { id: 'INFO_ON_BACK_PRESSED_OVERRIDE', lang: 'kotlin', fail: 'override fun onBackPressed()', pass: 'BackHandler { }' },
  { id: 'API37_SMS_RECEIVER_OTP', lang: 'kotlin', fail: 'SMS_RECEIVED', pass: 'SmsRetriever.startSmsUserConsent()', targetSdk: 37 },
];

allRules.forEach(({ id, lang, fail, pass, targetSdk }) => {
  test(`Rule: ${id}`, () => {
    const ctx = { language: lang, targetSdk: targetSdk ?? 36 };
    const vFail = runRules(fail, ctx);
    assert.ok(vFail.some(v => v.ruleId === id), `Rule ${id} should have fired on: ${fail}`);
    
    const vPass = runRules(pass, ctx);
    assert.ok(!vPass.some(v => v.ruleId === id), `Rule ${id} should NOT have fired on: ${pass}`);
  });
});
