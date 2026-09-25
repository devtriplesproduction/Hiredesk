const fs = require('fs');

const path = 'E:\\Triple S Production\\Hiredesk-main\\src\\app\\(app)\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /key: "review",\s*label: "In Review",/g,
  `key: "screening",\n                  label: "Screening",`
);

content = content.replace(
  /key: "offer_accepted",\s*label: "Offered",/g,
  `key: "offer_accepted",\n                  label: "Accepted",`
);


fs.writeFileSync(path, content, 'utf8');
console.log('Patched page.tsx');
