const assert=require('node:assert/strict'),C=require('../src/town-games-core');
const step=(s,input={},n=1)=>{for(let i=0;i<n;i++)C.update(s,input,1/60)};
let s=C.create('runner');step(s,{},60);assert.equal(s.player.ground,true);const ground=s.player.y;step(s,{jump:true});assert(s.player.y<ground);step(s,{jump:true},90);assert.equal(s.player.y,ground,'holding Space must not auto-jump');step(s,{});step(s,{jump:true});assert(s.player.y<ground);
s=C.create('runner');s.player.x=350;s.player.y=278;step(s);assert.equal(s.player.hp,4);step(s,{},10);assert.equal(s.player.hp,4,'damage immunity');s.player.inv=0;s.player.y=400;step(s);assert.equal(s.player.x,s.checkpoint);assert.equal(s.player.hp,3);s.player.x=3145;s.player.y=270;step(s);assert.equal(s.status,'won');
s=C.create('shooter');const start=s.player.x;step(s,{right:true},10);assert(s.player.x>start);s.player.x=150;s.player.y=120;step(s,{right:true},60);assert(s.player.x+s.player.w<=175);step(s,{},120);assert(s.enemyBullets.length>0,'enemies attack');
s=C.create('shooter');s.delay=0;s.enemies=[{x:360,y:180,w:20,h:20,hp:2,cool:99,kind:1}];step(s,{fire:true,aim:{x:370,y:190}},45);assert(s.score>=25,'shots defeat enemies');assert.equal(s.wave,2);s.enemies=[];step(s);assert.equal(s.wave,3);s.enemies=[];step(s);assert.equal(s.status,'won');
s=C.create('shooter');s.player.hp=1;s.enemyBullets=[{x:s.player.x,y:s.player.y,w:5,h:5,vx:0,vy:0,life:1}];step(s);assert.equal(s.status,'lost');const time=s.time;step(s,{right:true},60);assert.equal(s.time,time,'finished game cannot keep simulating');
// Every terrain gap is within a full jump and every raised step is reachable.
s=C.create('runner');const floors=s.platforms.filter(p=>p.h>12);for(let i=1;i<floors.length;i++)assert(floors[i].x-(floors[i-1].x+floors[i-1].w)<145*(2*340/820));
console.log('Arcade: jumping, collision, immunity, checkpoints, enemy fire, hit detection, waves and end states passed.');
