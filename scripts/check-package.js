const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),app=path.join(root,'release/win-unpacked/resources/app'),pkg=require('../package.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let count=0;
function compare(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(entry.isDirectory())compare(rel);else{assert(fs.existsSync(path.join(app,rel)),'Packaged file missing: '+rel);assert.equal(hash(path.join(app,rel)),hash(path.join(root,rel)),'Packaged file differs: '+rel);count++;}}}
compare('src');compare('assets');
assert.equal(JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8')).version,pkg.version);
assert(!fs.existsSync(path.join(app,'assets/videos/raw')));
for(const name of [`hamster-pet-setup-${pkg.version}.exe`,`hamster-pet-portable-${pkg.version}.exe`]){const file=path.join(root,'release',name);assert(fs.statSync(file).size>1000000);const fd=fs.openSync(file,'r'),header=Buffer.alloc(2);fs.readSync(fd,header,0,2,0);fs.closeSync(fd);assert.equal(header.toString(),'MZ');}
console.log(`Packaged ${count} source/asset files match the public inputs, both Windows executables exist; no installer or App executed.`);
