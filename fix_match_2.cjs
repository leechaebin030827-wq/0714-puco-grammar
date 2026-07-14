const fs = require('fs');
let content = fs.readFileSync('/Users/yoon/Desktop/PUCO/api/match.js', 'utf8');

// Replace the loop
content = content.replace(/for \(const rule of localScenarios\) \{[\s\S]*?\}\n    \}/, '');

fs.writeFileSync('/Users/yoon/Desktop/PUCO/api/match.js', content, 'utf8');
