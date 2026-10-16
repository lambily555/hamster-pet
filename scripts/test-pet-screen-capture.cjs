const {app,BrowserWindow,ipcMain,Menu,desktopCapturer,screen}=require('electron');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const out=path.join(__dirname,'../temp/screen-capture-regression');fs.mkdirSync(out,{recursive:true});app.requestSingleInstanceLock=()=>true;app.setPath('userData',path.join(out,'profile'));
let trayMenu;const buildMenu=Menu.buildFromTemplate;Menu.buildFromTemplate=function(template){const menu=buildMenu.call(this,template);if(template.some(i=>i.label==='叫鼠鼠回来'))trayMenu=menu;return menu};
const pause=ms=>new Promise(r=>setTimeout(r,ms));fs.rmSync(path.join(out,'error.txt'),{force:true});setTimeout(()=>app.exit(2),45000);
app.on('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{
 if(!w.webContents.getURL().endsWith('index.html'))return;
 try{
  await pause(1800);w.focus();await pause(100);
  await w.webContents.executeJavaScript("closeButton.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));window.dispatchEvent(new Event('blur'));closeButton.click()");
  await pause(100);assert.ok(w.isVisible(),'Interrupted close must not hide pet');
  await w.webContents.executeJavaScript("closeButton.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));closeButton.dispatchEvent(new Event('pointercancel'));closeButton.click()");assert.ok(w.isVisible(),'Cancelled press must not hide pet');
  await w.webContents.executeJavaScript("closeButton.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));closeButton.click()");await pause(100);assert.equal(w.isVisible(),false,'Intentional close must still work');
  trayMenu.items.find(i=>i.label==='叫鼠鼠回来').click();await pause(120);assert.ok(w.isVisible());w.minimize();await pause(1100);assert.equal(w.isMinimized(),false,'Tray restore must clear hidden flag for subsequent recovery');
  const b=w.getBounds(),backdrop=new BrowserWindow({...b,frame:false,backgroundColor:'#345678',webPreferences:{backgroundThrottling:false}});await backdrop.loadURL('data:text/html,<body style="margin:0;background:%23345678"></body>');w.showInactive();w.moveTop();
  const results=[];for(const form of ['3d','ai-drama','real']){
   await w.webContents.executeJavaScript(`window.petAPI.saveSettings({petForm:${JSON.stringify(form)},outfit:'none'})`);await pause(1700);backdrop.focus();await pause(300);w.moveTop();
   const d=screen.getPrimaryDisplay(),s=d.scaleFactor,sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:Math.round(d.size.width*s),height:Math.round(d.size.height*s)}}),image=sources[0].thumbnail.crop({x:Math.round(b.x*s),y:Math.round(b.y*s),width:Math.round(b.width*s),height:Math.round(b.height*s)}),pixels=image.toBitmap();let painted=0;for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-120)+Math.abs(pixels[i+1]-86)+Math.abs(pixels[i+2]-52)>100)painted++;
   assert.ok(painted>4000,form+' must appear in desktop capture while unfocused');assert.ok(w.isVisible());assert.equal(await w.webContents.executeJavaScript('document.hasFocus()'),false);fs.writeFileSync(path.join(out,form+'.png'),image.toPNG());results.push({form,paintedPixels:painted,visible:true,unfocused:true});
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({interruptedCloseIgnored:true,pointerCancelIgnored:true,intentionalHideWorks:true,trayRecoveryWorks:true,desktopCapture:results},null,2));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)}
}));require('../src/main.js');

