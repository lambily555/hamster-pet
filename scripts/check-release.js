const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),exists=p=>fs.existsSync(path.join(root,p));
const pkg=JSON.parse(read('package.json'));
assert.match(pkg.packageManager,/^pnpm@11\./);assert(!read('pnpm-workspace.yaml').includes('set this'));assert(!read('pnpm-workspace.yaml').includes('onlyBuiltDependencies'));
assert.match(read('pnpm-workspace.yaml'),/electron: true/);assert.match(read('pnpm-workspace.yaml'),/esbuild: true/);
for(const file of fs.readdirSync(path.join(root,'src'))){
 const rel='src/'+file,s=read(rel);
 assert(!/quadruped-preview|xhs-motion-inspect/.test(file),'Obsolete preview: '+file);
 assert(!s.includes('assets/videos/raw/'),'Raw video reference: '+file);
 if(file.endsWith('.js'))execFileSync(process.execPath,['--check',path.join(root,rel)],{stdio:'pipe'});
 const refs=file.endsWith('.html')?[...s.matchAll(/(?:src|href)=["']([^"']+)["']/g)]:[...s.matchAll(/(?:from\s*|require\()["'](\.[^"']+)["']/g)];
 for(const [,ref] of refs){if(/^(?:https?:|data:|#)/.test(ref))continue;const dest=path.resolve(root,'src',ref.split('?')[0]);assert(fs.existsSync(dest)||fs.existsSync(dest+'.js'),`${file}: missing ${ref}`);}
}
const manifest=JSON.parse(read('assets/ai-drama-pet/manifest.json'));
for(const item of Object.values(manifest.actions))assert(exists('assets/ai-drama-pet/'+item.file),'Missing animation '+item.file);
for(const item of ['Mesh/Ham.fbx','Texture/Ham.png'])assert(exists('assets/models/booth-hamster/restored/Assets/Ham/'+item));
for(let n=2;n<=29;n++)assert(exists(`assets/mariah-hall/${String(n).padStart(2,'0')}.jpg`));
assert.equal(fs.readdirSync(path.join(root,'assets/models/cube-pets')).filter(n=>/^animal-.*\.glb$/.test(n)).length,24);
for(const kind of ['wood','marble','tile'])for(const channel of ['Color','NormalGL','Roughness'])assert(exists(`assets/town-materials/${kind}-${channel}.jpg`));
assert(exists('assets/mouse-real-icon-v2.ico'));
console.log('Release check passed: source syntax, local entry points, model/texture/animation assets, install configuration; no App launched.');
