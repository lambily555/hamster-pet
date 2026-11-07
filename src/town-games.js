(function(){
  window.createTownGames=function(host,onExit,canPlay){
    const C=TownGamesCore,t=s=>TownI18n.t(s),root=document.createElement('section');root.className='ham-games';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label',t('鼠鼠游戏'));
    root.innerHTML='<div class="ham-game-shell"><canvas width="640" height="360" tabindex="0"></canvas><div class="ham-game-toolbar"><button data-game="exit">返回手机</button><span class="ham-game-title"></span><button data-game="pause">暂停</button></div><div class="ham-game-overlay"><div><b></b><p></p><button data-game="resume">开始游戏</button><button data-game="retry">重新开始</button></div></div><div class="ham-game-controls"><div class="ham-game-pad"><button data-hold="up" aria-label="向上">▲</button><button data-hold="left" aria-label="向左">◀</button><button data-hold="down" aria-label="向下">▼</button><button data-hold="right" aria-label="向右">▶</button></div><button class="ham-game-action" data-hold="jump">跳跃</button><button class="ham-game-action" data-hold="fire">射击</button></div></div>';
    host.append(root);const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),overlay=root.querySelector('.ham-game-overlay'),keys=new Set(),touch=new Map();let state=null,paused=true,raf=0,last=0,acc=0,mouseFire=false,aim=null,focus=null;
    const color={ink:'#302c43',cream:'#fff0cf',grass:'#7fba78',earth:'#a56b55'};
    function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
    function hamster(x,y,face=1){ctx.save();ctx.translate(Math.round(x+9),Math.round(y));ctx.scale(face,1);rect(-8,1,5,7,'#b88462');rect(3,1,5,7,'#b88462');rect(-7,2,3,4,'#efb3a3');rect(4,2,3,4,'#efb3a3');rect(-8,6,16,16,'#dec3a0');rect(-5,13,10,8,'#fff0d1');rect(-5,9,2,3,color.ink);rect(4,9,2,3,color.ink);rect(0,13,3,2,'#bb756c');rect(-6,22,5,2,'#a3735b');rect(3,22,5,2,'#a3735b');ctx.restore()}
    function monster(e){rect(e.x,e.y+4,e.w,e.h-4,e.kind?'#bd7f94':'#776b9b');rect(e.x+2,e.y,5,6,'#bda6bd');rect(e.x+13,e.y,5,6,'#bda6bd');rect(e.x+4,e.y+8,4,4,'#fff2d4');rect(e.x+12,e.y+8,4,4,'#fff2d4');rect(e.x+6,e.y+9,2,3,color.ink);rect(e.x+12,e.y+9,2,3,color.ink);rect(e.x+3,e.y+18,4,3,color.ink);rect(e.x+14,e.y+18,4,3,color.ink)}
    function text(value,x,y,size=10,c=color.cream,align='left'){ctx.fillStyle=c;ctx.font=size+'px monospace';ctx.textAlign=align;ctx.fillText(value,Math.round(x),Math.round(y))}
    function render(){if(!state)return;const s=state,p=s.player;ctx.imageSmoothingEnabled=false;
      if(s.mode==='runner'){
        rect(0,0,640,360,'#a8cfce');for(let i=0;i<9;i++){const x=((i*130-s.camera*.22)%770+770)%770-65;rect(x,87+(i%3)*21,58,12,'#e8edce');rect(x+12,79+(i%3)*21,32,10,'#e8edce');rect(x-30,230+(i%2)*20,95,100,'#89b49b');rect(x-16,216+(i%2)*20,66,28,'#89b49b');}
        ctx.save();ctx.translate(-Math.floor(s.camera),0);
        for(const b of s.platforms){rect(b.x,b.y,b.w,b.h,color.earth);rect(b.x,b.y,b.w,6,color.grass);rect(b.x,b.y+6,b.w,3,'#4f7954');for(let x=b.x+6;x<b.x+b.w;x+=24)rect(x,b.y+18,9,3,'#cf9770');}
        for(const h of s.spikes)for(let x=h.x;x<h.x+h.w;x+=9){rect(x,h.y+8,8,6,'#e5e2d5');rect(x+2,h.y+3,4,6,'#fff6d7');rect(x+3,h.y,2,4,'#fff6d7');}
        for(const g of s.gates){rect(g.x+9,145,3,148,'#718384');rect(g.x,g.y,g.w,g.h,'#75576d');rect(g.x+3,g.y+3,g.w-6,g.h-6,'#b87f87');rect(g.x+6,g.y+13,10,4,'#f2d58f');}
        for(const e of s.enemies)if(e.alive)monster(e);
        for(const c of s.coins)if(!c.taken){rect(c.x-3,c.y-6,6,12,'#f1c568');rect(c.x-1,c.y-4,2,8,'#fff0b0');}
        for(const x of [980,1920]){rect(x,267,3,35,'#654e43');rect(x+3,267,18,12,s.checkpoint>=x?'#f3d37d':'#a6a4bb');}
        rect(3130,245,40,57,'#7f6881');rect(3125,240,50,7,'#e7bc81');rect(3140,263,19,39,'#3c4556');rect(3145,268,8,28,'#edd6a4');
        if(p.inv===0||Math.floor(s.time*12)%2===0)hamster(p.x,p.y,p.face);for(const q of s.particles)rect(q.x,q.y,3,3,q.color);ctx.restore();
      }else{
        rect(0,0,640,360,'#34374d');for(let y=48;y<360;y+=24)for(let x=0;x<640;x+=24){rect(x,y,23,23,(x/24+y/24)%2?'#3c4056':'#40465c');rect(x+3,y+3,2,2,'#4e5365');}
        for(const b of s.walls){rect(b.x,b.y+4,b.w,b.h,'#242b3e');rect(b.x,b.y,b.w,b.h-5,'#778b8a');rect(b.x+3,b.y+3,b.w-6,5,'#bbcca9');rect(b.x+7,b.y+15,b.w-14,4,'#536b70');}
        for(const e of s.enemies){if(s.delay>0){ctx.strokeStyle='#e7ab79';ctx.strokeRect(e.x-3,e.y-3,26,26);}else monster(e);}
        for(const b of s.bullets)rect(b.x,b.y,5,3,'#fff0a0');for(const b of s.enemyBullets){rect(b.x-1,b.y-1,7,7,'#cf6f86');rect(b.x+1,b.y+1,3,3,'#ffe2b1');}
        if(p.inv===0||Math.floor(s.time*12)%2===0)hamster(p.x,p.y,p.face);for(const q of s.particles)rect(q.x,q.y,3,3,q.color);
        if(aim){ctx.strokeStyle='#f2ce95';ctx.strokeRect(aim.x-4,aim.y-4,8,8);}
        if(s.delay>0)text(t('敌人即将出现'),320,180,14,'#ffde99','center');
      }
      rect(0,35,640,15,'#302c43');text('♥'.repeat(Math.max(0,p.hp))+'♡'.repeat(5-Math.max(0,p.hp)),12,46,12,'#efb1a2');text(t('得分')+' '+s.score,158,46,10);text(s.mode==='runner'?Math.floor(p.x/3160*100)+'%':t('波次')+' '+s.wave+'/3',625,46,10,color.cream,'right');
    }
    function clear(){keys.clear();touch.clear();mouseFire=false;acc=0;}
    function input(){const held=k=>keys.has(k)||[...touch.values()].includes(k);return {left:held('left'),right:held('right'),up:held('up'),down:held('down'),jump:held('jump'),fire:held('fire')||mouseFire,aim:[...touch.values()].includes('fire')?null:aim}}
    function panel(title,description,first=false){overlay.hidden=false;overlay.querySelector('b').textContent=t(title);overlay.querySelector('p').textContent=t(description);const resume=overlay.querySelector('[data-game=resume]');resume.hidden=state.status!=='playing';resume.textContent=t(first?'开始游戏':'继续游戏');overlay.querySelector('[data-game=retry]').hidden=first;}
    function pause(){if(!state)return;paused=true;clear();panel('游戏已暂停','点击继续游戏，或返回手机。')}
    function start(mode){if(!canPlay())return;focus=document.activeElement;state=C.create(mode);root.hidden=false;host.classList.add('phone-gaming');document.body.dataset.townGame='open';root.dataset.mode=mode;paused=true;clear();aim=null;root.querySelector('.ham-game-title').textContent=t(mode==='runner'?'鼠鼠跑酷':'鼠鼠射击');TownI18n.render(root);panel(mode==='runner'?'鼠鼠跑酷':'鼠鼠射击',mode==='runner'?'左右键或 A/D 移动，空格跳跃。避开尖刺、升降机关和怪物，到达树洞终点。':'方向键或 WASD 移动，鼠标瞄准，按住左键射击；触屏按住射击自动瞄准。躲开敌人与弹幕，坚持三波。',true);render();cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(frame);canvas.focus();}
    function close(){cancelAnimationFrame(raf);state=null;clear();root.hidden=true;host.classList.remove('phone-gaming');delete document.body.dataset.townGame;focus?.focus();}
    function frame(now){if(!state)return;let dt=Math.min(.1,(now-last)/1000);last=now;if(!paused){if(!canPlay()){pause();panel('游戏已暂停','主鼠正在休息，醒来后可以继续游戏。')}else{acc+=dt;while(acc>=1/60){C.update(state,input(),1/60);acc-=1/60;}if(state.status!=='playing'){paused=true;clear();panel(state.status==='won'?'闯关成功':'本次挑战结束','得分：'+state.score);}}}render();raf=requestAnimationFrame(frame);}
    root.addEventListener('click',e=>{const action=e.target.closest('[data-game]')?.dataset.game;if(!action)return;e.stopPropagation();if(action==='exit'){close();onExit()}else if(action==='pause')pause();else if(action==='retry')start(state.mode);else if(action==='resume'&&canPlay()){paused=false;overlay.hidden=true;clear();canvas.focus();}});
    function point(e){const r=canvas.getBoundingClientRect();return matchMedia('(orientation:portrait)').matches?{x:(e.clientY-r.top)/r.height*640,y:(1-(e.clientX-r.left)/r.width)*360}:{x:(e.clientX-r.left)/r.width*640,y:(e.clientY-r.top)/r.height*360};}
    root.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-hold]');if(b){e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.hold)}else if(e.target===canvas&&state?.mode==='shooter'&&e.button===0){canvas.setPointerCapture(e.pointerId);aim=point(e);mouseFire=true;e.preventDefault()}});
    canvas.addEventListener('pointermove',e=>{if(state?.mode==='shooter')aim=point(e)});
    const release=e=>{touch.delete(e.pointerId);if(e.target===canvas)mouseFire=false};root.addEventListener('pointerup',release);root.addEventListener('pointercancel',release);root.addEventListener('lostpointercapture',release);root.addEventListener('contextmenu',e=>e.preventDefault());
    const mapping={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyJ:'fire'};
    function key(e){if(!state)return;e.stopImmediatePropagation();if(e.key==='Tab'){const nodes=[...root.querySelectorAll('button')].filter(n=>n.getClientRects().length&&!n.closest('[hidden]'));const at=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(at+(e.shiftKey?-1:1)+nodes.length)%nodes.length]?.focus();return}if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return}if(e.code==='KeyP'){e.preventDefault();if(!e.repeat)pause();return}if(mapping[e.code]){e.preventDefault();keys.add(mapping[e.code]);}}
    window.addEventListener('keyup',e=>{if(!state)return;if(mapping[e.code]){keys.delete(mapping[e.code]);e.preventDefault();e.stopImmediatePropagation()}} ,true);
    window.addEventListener('blur',()=>{if(state)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state)pause()});window.addEventListener('resize',()=>{if(state)pause()});
    return {start,close,key,get active(){return !!state},inspect:()=>state?{mode:state.mode,status:state.status,paused,hp:state.player.hp,x:state.player.x,y:state.player.y,wave:state.wave,score:state.score,shots:state.bullets.length}:null};
  };
})();
