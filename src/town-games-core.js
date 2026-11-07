(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TownGamesCore=api})(typeof globalThis==='undefined'?this:globalThis,()=>{
  const W=640,H=360,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const box=(x,y,w,h)=>({x,y,w,h});
  function create(mode){
    const s={mode,time:0,status:'playing',score:0,player:{x:40,y:240,w:18,h:24,vx:0,vy:0,hp:5,inv:0,ground:false,face:1},camera:0,checkpoint:40,jumpHeld:false,bullets:[],enemyBullets:[],particles:[],wave:0,delay:0,fire:0};
    if(mode==='runner'){
      s.platforms=[[0,302,430,58],[490,302,400,58],[950,302,400,58],[1410,302,410,58],[1880,302,450,58],[2390,302,810,58],[240,250,72,12],[600,246,86,12],[760,198,82,12],[1120,247,85,12],[1510,250,90,12],[1670,204,82,12],[2090,246,82,12],[2510,250,100,12],[2680,206,85,12],[2850,248,90,12]].map(r=>box(...r));
      s.spikes=[350,700,1210,1760,2190,2600,2980].map(x=>box(x,288,26,14));
      s.gates=[820,1600,2280,2800].map((x,i)=>({...box(x,210,22,44),phase:i*1.4}));
      s.enemies=[550,1010,1460,1980,2460,2870].map((x,i)=>({...box(x,282,20,20),home:x,dir:i%2?1:-1,alive:true}));
      s.coins=[180,275,620,790,1040,1150,1540,1690,2000,2120,2530,2710,2870,3090].map(x=>({x,y:(s.platforms.find(p=>p.x<=x&&x<=p.x+p.w&&p.h===12)?.y||302)-24,taken:false}));
    }else{s.player.x=310;s.player.y=180;s.walls=[box(175,104,44,56),box(420,104,44,56),box(175,238,44,40),box(420,238,44,40)];s.enemies=[];spawn(s)}return s;
  }
  function spawn(s){s.wave++;s.delay=1.1;s.enemyBullets=[];const points=[[45,66],[575,66],[45,285],[575,285],[310,60],[310,290],[45,175],[575,175]];s.enemies=points.slice(0,2+s.wave*2).map(([x,y],i)=>({...box(x,y,20,20),hp:2,cool:.6+i*.22,kind:i%2}));}
  function burst(s,x,y,color){for(let i=0;i<8;i++)s.particles.push({x,y,vx:Math.cos(i*Math.PI/4)*40,vy:Math.sin(i*Math.PI/4)*40,life:.35,color})}
  function hurt(s,pit=false){const p=s.player;if(p.inv>0&&!pit)return;p.hp--;p.inv=1.3;burst(s,p.x+9,p.y+12,'#f5998b');if(pit){p.x=s.checkpoint;p.y=230;p.vy=0;}if(p.hp<=0)s.status='lost';}
  function move(p,dx,dy,solids){p.x+=dx;for(const b of solids)if(hit(p,b))p.x=dx>0?b.x-p.w:b.x+b.w;p.y+=dy;p.ground=false;for(const b of solids)if(hit(p,b)){if(dy>=0){p.y=b.y-p.h;p.ground=true}else p.y=b.y+b.h;p.vy=0;}}
  function update(s,input,dt){if(s.status!=='playing')return;dt=clamp(dt,0,.025);s.time+=dt;const p=s.player;p.inv=Math.max(0,p.inv-dt);s.particles=s.particles.filter(q=>(q.life-=dt)>0);for(const q of s.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;}
    if(s.mode==='runner'){
      p.vx=((input.right?1:0)-(input.left?1:0))*145;if(p.vx)p.face=Math.sign(p.vx);
      if(input.jump&&!s.jumpHeld&&p.ground){p.vy=-340;p.ground=false;}s.jumpHeld=!!input.jump;
      p.vy+=820*dt;move(p,p.vx*dt,p.vy*dt,s.platforms);p.x=clamp(p.x,0,3180);if(p.y>390)hurt(s,true);
      for(const g of s.gates)g.y=210+Math.sin(s.time*2.3+g.phase)*66;
      for(const e of s.enemies){if(!e.alive)continue;e.x+=e.dir*32*dt;if(Math.abs(e.x-e.home)>42)e.dir*=-1;if(hit(p,e))hurt(s);}
      for(const hazard of [...s.spikes,...s.gates])if(hit(p,hazard))hurt(s);
      for(const c of s.coins)if(!c.taken&&hit(p,box(c.x-5,c.y-6,10,12))){c.taken=true;s.score+=10;burst(s,c.x,c.y,'#ffdc82');}
      for(const x of [980,1920])if(p.x>=x&&p.ground&&s.checkpoint<x)s.checkpoint=x;
      s.camera=clamp(p.x-145,0,2560);if(p.x>3140){s.status='won';s.score+=100;}
    }else{
      s.delay=Math.max(0,s.delay-dt);let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),length=Math.hypot(dx,dy)||1;move(p,dx/length*135*dt,dy/length*135*dt,s.walls);p.x=clamp(p.x,16,W-16-p.w);p.y=clamp(p.y,49,H-18-p.h);
      if(dx)p.face=Math.sign(dx);s.fire=Math.max(0,s.fire-dt);
      if(input.fire&&s.fire===0){let aim=input.aim;if(!aim){const e=s.enemies.reduce((best,e)=>!best||Math.hypot(e.x-p.x,e.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?e:best,null);aim=e?{x:e.x+10,y:e.y+10}:{x:p.x+p.face*80,y:p.y+12};}const angle=Math.atan2(aim.y-p.y-12,aim.x-p.x-9);s.bullets.push({...box(p.x+7,p.y+10,4,4),vx:Math.cos(angle)*310,vy:Math.sin(angle)*310,life:2});s.fire=.16;}
      for(const e of s.enemies){if(s.delay>0)continue;const angle=Math.atan2(p.y-e.y,p.x-e.x);move(e,Math.cos(angle)*(e.kind?24:38)*dt,Math.sin(angle)*(e.kind?24:38)*dt,s.walls);e.cool-=dt;if(e.cool<=0){for(const offset of e.kind?[-.16,0,.16]:[0])s.enemyBullets.push({...box(e.x+8,e.y+8,5,5),vx:Math.cos(angle+offset)*95,vy:Math.sin(angle+offset)*95,life:5});e.cool=2.2-s.wave*.2;}if(hit(p,e))hurt(s);}
      for(const [shots,enemy] of [[s.bullets,false],[s.enemyBullets,true]])for(const b of shots){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.x<0||b.x>W||b.y<44||b.y>H||s.walls.some(w=>hit(b,w)))b.life=0;if(b.life<=0)continue;if(enemy){if(hit(b,p)){hurt(s);b.life=0}}else{const target=s.enemies.find(e=>e.hp>0&&hit(b,e));if(target){target.hp--;b.life=0;burst(s,b.x,b.y,'#e6d58d');if(target.hp===0)s.score+=25;}}}
      s.bullets=s.bullets.filter(b=>b.life>0);s.enemyBullets=s.enemyBullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);if(!s.enemies.length&&s.status==='playing'){if(s.wave===3)s.status='won';else spawn(s);}
    }return s;
  }
  return {create,update,hit,W,H};
});
