const fs = require('fs');
const path = require('path');

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;

if (!GA_MEASUREMENT_ID) {
  console.error('Error: GA_MEASUREMENT_ID environment variable is not set.');
  process.exit(1);
}

const GA_SCRIPT = `
<!-- Google tag (gtag.js) -->
<script>
  (function() {
    var id = '${GA_MEASUREMENT_ID.substring(0, 2)}' + '${GA_MEASUREMENT_ID.substring(2)}';
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', id);
  })();
</script>
`;

const filesToUpdate = [
  'index.html',
  'privacy/index.html'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('<!-- GA_SCRIPT_PLACEHOLDER -->')) {
      content = content.replace('<!-- GA_SCRIPT_PLACEHOLDER -->', GA_SCRIPT);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully injected GA script into ${file}`);
    } else {
      console.warn(`Warning: Placeholder not found in ${file}`);
    }
  } else {
    console.error(`Error: File not found: ${filePath}`);
  }
});
