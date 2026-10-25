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

{const now=Date.now(),state=sim.defaults(now);state.stamina=100;state.npcs[0].stamina=100;state.npcs[0].health=100;const begun=sim.beginOuting(state,state.npcs[0].id,'visit','中心广场',now);assert.equal(begun.ok,true);begun.state.outing.status='ready';const outing=begun.state.outing,energy=begun.state.stamina,relationship=begun.state.npcs[0].relationship;assert.equal(outing.options[2].exit,true);const left=sim.resolveOuting(begun.state,outing.id,2,now,0);assert.equal(left.cancelled,true);assert.equal(left.state.outing,null);assert.equal(left.state.stamina,energy);assert.equal(left.state.npcs[0].relationship,relationship);assert.equal(sim.resolveOuting(left.state,outing.id,2,now,0).ok,false);const absurd=sim.resolveOuting(begun.state,outing.id,1,now,0);assert.equal(absurd.change,0);assert.equal(absurd.state.outing.questionIndex,1);assert.equal(absurd.state.outing.options[2].exit,true);console.log('PASS outing: fixed choices, free cancellation, stale reply rejected, absurd answer continues');}
