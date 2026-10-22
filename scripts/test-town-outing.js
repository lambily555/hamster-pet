const assert=require('node:assert/strict'),sim=require('../src/town-sim');
(async()=>{
 const now=Date.now(),state=sim.defaults(now),npc=state.npcs[0];state.stamina=100;npc.stamina=100;npc.health=100;npc.autoSleep=false;
 const rejected=sim.beginOuting(state,npc.id,'pets','中心广场',now);assert.equal(rejected.ok,false);assert.match(rejected.message,/双方都领养/);assert.equal(rejected.state.stamina,100);
 const {createTownLife}=await import('../src/town-life.js');
 for(const celebrating of [false,true]){
  const events=[],life=createTownLife(e=>events.push(e));life.add('main','鼠鼠小屋');life.add('friend','零食铺');
  if(celebrating)life.setCelebration({key:'birthday',birthdays:['friend']});
  life.setOuting({id:'trip',npcId:'friend',place:'中心广场',activity:'pets'});
  for(let i=0;i<1500&&!events.some(e=>e.type==='outing-ready');i++)life.tick(.1);
  assert.ok(events.some(e=>e.type==='outing-ready'),`Plaza arrival, celebration=${celebrating}`);
  assert.equal(life.actors.get('main').phase,'activity');assert.equal(life.actors.get('friend').phase,'activity');
 }
 console.log('PASS missing-pet reason without stamina charge; plaza outings reach ready during normal days and celebrations');
})().catch(e=>{console.error(e);process.exitCode=1});
