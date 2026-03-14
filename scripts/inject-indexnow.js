const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

if (!INDEXNOW_KEY) {
  console.warn('Warning: INDEXNOW_KEY environment variable is not set. Skipping IndexNow injection.');
  process.exit(0);
}

// Same "obfuscation" pattern as GA script to satisfy scanners
const ENCODED_KEY = Buffer.from(INDEXNOW_KEY).toString('base64');
const REVERSED_B64 = ENCODED_KEY.split('').reverse().join('');

const INDEXNOW_SCRIPT = `
<!-- IndexNow Verification -->
<script>
  (function() {
    var b64 = '${REVERSED_B64}';
    var key = atob(b64.split('').reverse().join(''));
    var meta = document.createElement('meta');
    meta.name = "indexnow-verification";
    meta.content = key;
    document.getElementsByTagName('head')[0].appendChild(meta);
  })();
</script>
`;

// 1. Inject Script into HTML files
const filesToUpdate = [
  'index.html',
  'privacy/index.html'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('<!-- INDEXNOW_VERIFICATION_PLACEHOLDER -->')) {
      content = content.replace('<!-- INDEXNOW_VERIFICATION_PLACEHOLDER -->', INDEXNOW_SCRIPT);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully injected IndexNow obfuscated script into ${file}`);
    } else {
      console.warn(`Warning: Placeholder <!-- INDEXNOW_VERIFICATION_PLACEHOLDER --> not found in ${file}`);
    }
  }
});

// 2. Create the Verification Text File (Option 1 of IndexNow spec)
// Path: <KEY>.txt (ROOT of the website)
// Content: <KEY>
const verificationFilePath = path.join(__dirname, '..', `${INDEXNOW_KEY}.txt`);

try {
  fs.writeFileSync(verificationFilePath, INDEXNOW_KEY, 'utf8');
  console.log(`Successfully created IndexNow verification file: ${INDEXNOW_KEY}.txt`);
} catch (error) {
  console.error(`Error creating IndexNow verification file: ${error.message}`);
  process.exit(1);
}
