const {execFileSync}=require('node:child_process');
const tests=['test-locale-build.js','test-local-chat.js','test-action-localization.js','test-diary-localization.js','test-pet-identity.js','test-town-i18n.js','test-town-dialogue.js','test-town-outing.js','test-town-aging.js','test-town-lottery.js','test-town-calendar.js','test-town-population.js','test-town-pets.js','test-town-free-pets.js','test-town-pet-inheritance.js','test-town-restaurant.js','test-town-surfaces.js','test-town-wall-materials.js','test-town-world-surfaces.js'];
for(const test of tests){console.log('\n'+test);execFileSync(process.execPath,['scripts/'+test],{stdio:'inherit'});}
console.log('\nAll release regression checks passed; no Electron process launched.');
