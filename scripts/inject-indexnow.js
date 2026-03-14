const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

if (!INDEXNOW_KEY) {
  console.warn('Warning: INDEXNOW_KEY environment variable is not set. Skipping IndexNow injection.');
  process.exit(0); // Exit gracefully so the build doesn't fail if key is missing
}

// 1. Inject Meta Tag into HTML files
const filesToUpdate = [
  'index.html',
  'privacy/index.html'
];

const META_TAG = `<meta name="indexnow-verification" content="${INDEXNOW_KEY}" />`;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('<!-- INDEXNOW_VERIFICATION_PLACEHOLDER -->')) {
      content = content.replace('<!-- INDEXNOW_VERIFICATION_PLACEHOLDER -->', META_TAG);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully injected IndexNow meta tag into ${file}`);
    } else {
      console.warn(`Warning: Placeholder <!-- INDEXNOW_VERIFICATION_PLACEHOLDER --> not found in ${file}`);
    }
  }
});

// 2. Create the Verification Text File (Option 1 of IndexNow spec)
// Path: public/<KEY>.txt
// Content: <KEY>
const verificationFilePath = path.join(__dirname, '..', 'public', `${INDEXNOW_KEY}.txt`);

try {
  fs.writeFileSync(verificationFilePath, INDEXNOW_KEY, 'utf8');
  console.log(`Successfully created IndexNow verification file: public/${INDEXNOW_KEY}.txt`);
} catch (error) {
  console.error(`Error creating IndexNow verification file: ${error.message}`);
  process.exit(1);
}
