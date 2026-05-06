// scripts/precompile-hbs.ts
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

const templatesDir = path.join(process.cwd(), 'app/lib/email/emailTemplates');
const outputDir   = path.join(process.cwd(), 'app/lib/email/compiled'); // you can choose another location

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));

files.forEach(file => {
  const source = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  const precompiled = Handlebars.precompile(source);
  const moduleCode = `import Handlebars from 'handlebars';\nexport default Handlebars.template(${precompiled});\n`;
  const outName = file.replace('.hbs', '.hbs.js');
  fs.writeFileSync(path.join(outputDir, outName), moduleCode, 'utf8');
  console.log(`Compiled: ${file} -> ${outName}`);
});

console.log('All Handlebars templates compiled.');