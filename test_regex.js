const text = `
// FILE: App.jsx
\`\`\`jsx
import React from 'react';
\`\`\`
// FILE: Home.jsx
\`\`\`jsx
import React from 'react';
\`\`\`
`;
const fileRegex = /\/\/\s*FILE:\s*([a-zA-Z0-9_.-]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/gi;
let match;
while ((match = fileRegex.exec(text)) !== null) {
  console.log("Found:", match[1]);
}
