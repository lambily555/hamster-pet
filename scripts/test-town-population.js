const assert=require('node:assert/strict'),sim=require('../src/town-sim.js');
const now=new Date(2026,9,4,12).getTime(),DAY=86400000;
let state=sim.defaults(now);
assert.equal(sim.population(state),10);
state=sim.prepareImmigration(state,now);assert.equal(state.immigration.candidates.length,8);
assert.deepEqual(sim.prepareImmigration(state,now+1).immigration,state.immigration,'reopening keeps the same candidates');
assert.equal(new Set(state.immigration.candidates.map(c=>c.coat)).size,4);
const ids=state.immigration.candidates.slice(0,5).map(c=>c.id);
assert.equal(sim.admitResidents(state,ids.slice(0,4),now).ok,false);
assert.equal(sim.admitResidents(state,[...ids.slice(0,4),ids[0]],now).ok,false);
assert.equal(sim.admitResidents(state,[...ids.slice(0,4),'not-a-candidate'],now).ok,false);
const admitted=sim.admitResidents(state,ids,now);assert.equal(admitted.ok,true);assert.equal(sim.population(admitted.state),15);assert.equal(admitted.state.npcs.length,14);assert.equal(sim.admitResidents(admitted.state,ids,now).ok,false);
assert.deepEqual(sim.migrate(JSON.parse(JSON.stringify(admitted.state)),now).npcs,admitted.state.npcs);
admitted.state.npcs.at(-1).alive=false;assert.equal(sim.population(admitted.state),14);assert.equal(sim.prepareImmigration(admitted.state,now).immigration.candidates.length,8);
const fourteen=sim.defaults(now);fourteen.offspring=Array.from({length:4},(_,i)=>({id:'p'+i,stage:'幼鼠',ageYears:0}));assert.equal(sim.population(fourteen),14);const fifteen=sim.prepareImmigration({...fourteen,npcOffspring:[{id:'extra',stage:'幼鼠'}]},now);assert.equal(sim.population(fifteen),15);assert.equal(fifteen.immigration.candidates.length,8);const twenty=sim.admitResidents(fifteen,fifteen.immigration.candidates.slice(0,5).map(n=>n.id),now);assert.equal(twenty.ok,true);assert.equal(sim.population(twenty.state),20);assert.equal(sim.prepareImmigration(twenty.state,now).immigration.candidates.length,0);
const adults=sim.defaults(now);adults.npcs.forEach(n=>n.ageYears=.8);const planned=sim.scheduleNpcPair(adults,'npc-0','npc-1',now);assert.equal(planned.ok,true);assert.equal(planned.state.npcOffspring.length,0);assert.equal(planned.state.npcBreeding.pending.length,1);assert.equal(sim.scheduleNpcPair(planned.state,'npc-0','npc-1',now).ok,false);
const due=planned.state.npcBreeding.pending[0].dueAt,realDue=now+(due-planned.state.calendarTime)/sim.calendarRate(planned.state.speed);
const before=sim.settle(planned.state,realDue-1000);assert.equal(before.npcOffspring.length,0,'no instant birth');
const born=sim.settle(before,realDue+1000);assert.ok(born.npcOffspring.length>0);assert.equal(born.npcBreeding.pending.length,0);assert.equal(born.birthNews.length,1);assert.equal(born.birthNews[0].calendarTime,due);assert.match(born.birthNews[0].text,/轮轮.*白大夫.*小屋/);
assert.equal(sim.settle(born,realDue+2000).birthNews.length,1,'birth announcement only once');
const offline=sim.settle(planned.state,now+DAY);assert.ok(offline.birthNews.some(n=>n.calendarTime===due),'offline birth retained for return');
const cancelled=structuredClone(planned.state);cancelled.npcs[0].alive=false;assert.equal(sim.settle(cancelled,realDue+1000).npcOffspring.length,0,'missing parent cancels pending birth');
console.log('Population threshold, candidate validation, admissions, planned births and offline news passed');

assert.equal(sim.scheduleNpcPair(planned.state,'npc-2','npc-3',now).ok,false,'only one nursery pair at a time');
const automatic=sim.settle(adults,now+5*DAY);assert.ok(automatic.birthNews.length>0,'automatic daily eligibility schedules births');assert.ok(automatic.npcBreeding.pending.length<=1);

// Exercise the actual confirmation handler with real recruitment validation.
const vm=require('node:vm'),source=require('node:fs').readFileSync(require.resolve('../src/dashboard.js'),'utf8');
const clickSource=source.slice(source.indexOf("$('#townAdmitVisitors').addEventListener"),source.indexOf("$('#townBirthPause').addEventListener"));
const trial=sim.prepareImmigration(sim.defaults(Date.now())),selectedIds=trial.immigration.candidates.slice(0,5).map(n=>n.id),jobValues=Object.fromEntries(selectedIds.map(id=>[id,'']));
let confirm,notice='',scrolled=false,saved=0;
const nodes={'#townAdmitVisitors':{addEventListener:(_,fn)=>confirm=fn},'#townImmigrationResult':{textContent:'',scrollIntoView:()=>scrolled=true},'#townImmigration':{hidden:false},'#townStory':{textContent:''}};
const context={townSim:sim,townState:trial,Date,TownI18n:{t:s=>s},saveTown:()=>saved++,renderTown:()=>{},showOutingNotice:s=>notice=s,$:selector=>nodes[selector],document:{querySelectorAll:()=>selectedIds.map(value=>({value}))}};
nodes['#townVisitorCards']={querySelectorAll:()=>selectedIds.map(value=>({value})),querySelector:selector=>({value:jobValues[selector.match(/"(.*?)"/)[1]]})};vm.createContext(context);vm.runInContext(clickSource,context);
confirm();assert.equal(sim.population(context.townState),10);assert.match(notice,/职业分配不符合要求/);assert(scrolled);assert.equal(nodes['#townImmigration'].hidden,false);
const vacant=sim.jobCounts(context.townState).filter(j=>!j.count);selectedIds.forEach((id,i)=>jobValues[id]=vacant[i]?.place||'');confirm();assert.equal(sim.population(context.townState),15);assert.equal(nodes['#townImmigration'].hidden,true);assert.match(notice,/新邻居已加入/);assert(saved>=2);
confirm();assert.equal(sim.population(context.townState),15);console.log('PASS actual confirm handler: visible failure reason, retained choices, successful admission feedback and duplicate protection.');
