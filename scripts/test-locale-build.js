const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('scripts/build-town-locales.js','utf8'),catalog=fs.readFileSync('src/town-locales.txt','utf8');
function generate(input){let result;const fakeFs={readFileSync:()=>input,writeFileSync:(_path,output)=>result=output};vm.runInNewContext(script,{require:name=>name==='fs'?fakeFs:require(name),__dirname:require('path').resolve('scripts'),console:{log(){}}});return result;}
assert.equal(generate(catalog),generate(catalog.trimEnd()+'\n'));
assert.equal(generate(catalog+' \r\n\r\n'),generate(catalog.trimEnd()+'\n'));
assert.equal(generate(catalog),fs.readFileSync('src/town-locales.js','utf8'));
console.log('PASS locale generation is identical before and after publication EOF normalization');
