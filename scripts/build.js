const fs=require('node:fs'),esbuild=require('esbuild'),{execFileSync}=require('node:child_process');
execFileSync(process.execPath,['scripts/build-town-locales.js'],{stdio:'inherit'});
for(const name of ['town','hamster3d']){
 const outfile=`src/${name}.bundle.js`;
 esbuild.buildSync({entryPoints:[`src/${name}.js`],bundle:true,format:'iife',outfile,logLevel:'info'});
 fs.writeFileSync(outfile,fs.readFileSync(outfile,'utf8').replace(/\t/g,'  ').replace(/[ \t]+$/gm,'').replace(/\r\n/g,'\n'));
}
