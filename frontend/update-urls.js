import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Components that need updating
const componentsToUpdate = [
  'src/components/ApiKeys.jsx',
  'src/components/Login.jsx',
  'src/components/MemberDashboard.jsx',
  'src/components/Performance.jsx',
  'src/components/DataSources.jsx',
  'src/components/Analytics.jsx',
  'src/components/KioskMonitoring.jsx'
];

// Process each component
componentsToUpdate.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if already imports config
    const hasConfigImport = content.includes("import { getApiUrl } from '../config'");
    
    // Add import if missing
    if (!hasConfigImport) {
      const importRegex = /^(import\s+.+from\s+['"'].+['"];?\s*\n)+/m;
      const match = content.match(importRegex);
      
      if (match) {
        const lastImportEnd = match.index + match[0].length;
        content = content.slice(0, lastImportEnd) + 
                  "import { getApiUrl } from '../config';\n" + 
                  content.slice(lastImportEnd);
      } else {
        // Add at the beginning after React import
        content = content.replace(
          /import React.+;\n/,
          "$&import { getApiUrl } from '../config';\n"
        );
      }
    }
    
    // Replace all hardcoded URLs
    // Pattern 1: fetch('https://pact-mvp-backend.philip-134.workers.dev/api/xxx')
    content = content.replace(
      /fetch\s*\(\s*['"]https:\/\/pact-mvp-backend\.philip-134\.workers\.dev(\/api[^'"]*)['"]/g,
      "fetch(getApiUrl('$1')"
    );
    
    // Pattern 2: fetch(`https://pact-mvp-backend.philip-134.workers.dev/api/xxx${variable}`)
    content = content.replace(
      /fetch\s*\(\s*`https:\/\/pact-mvp-backend\.philip-134\.workers\.dev(\/api[^`]*)`/g,
      "fetch(getApiUrl(`$1`)"
    );
    
    // Pattern 3: const BACKEND_URL = 'https://...'
    content = content.replace(
      /const\s+BACKEND_URL\s*=\s*['"]https:\/\/pact-mvp-backend\.philip-134\.workers\.dev['"]/g,
      "const BACKEND_URL = getApiUrl('')"
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${componentPath}`);
  } else {
    console.log(`❌ File not found: ${componentPath}`);
  }
});

console.log('\n🎉 URL update complete! All components now use the config.');
console.log('Remember to remove this script file after running it.'); 