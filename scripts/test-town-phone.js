const assert=require('node:assert/strict'),sim=require('../src/town-sim.js'),phone=require('../src/town-phone-data.js');const state=sim.defaults(Date.now());state.events=[{id:'one',text:'hello',time:1,mainId:state.mainId}];const before=phone.contacts(state);assert.equal(before.length,sim.residents(state).length);assert.equal(new Set(before.map(n=>n.number)).size,before.length);assert.equal(phone.unread(state).chat,true);phone.read(state,'chat');assert.equal(phone.unread(state).chat,false);const npc=state.npcs[0];assert.equal(phone.send(state,npc.id,'prepared','reply'),true);assert.equal(phone.sync(state).owner.threads[npc.id].length,2);phone.read(state,'calls');state.memorials.push({id:npc.id,name:npc.name});state.npcs.shift();assert.equal(phone.contacts(state).find(n=>n.id===npc.id).alive,false);assert.equal(phone.send(state,npc.id,'x','y'),false);assert.equal(phone.unread(state).calls,true);state.npcOffspring.push({id:'newborn',name:'New',alive:true});assert(phone.contacts(state).some(n=>n.id==='newborn'));phone.react(state,'one','like');phone.react(state,'one','save');phone.react(state,'one','comment','prepared');assert.equal(phone.sync(state).owner.reactions.one.comments.length,1);phone.react(state,'one','share');assert.equal(phone.sync(state).phone.feed.filter(e=>e.shared).length,1);assert.equal(phone.react(state,'one','share'),false);const restored=JSON.parse(JSON.stringify(state));assert.equal(phone.sync(restored).owner.reactions.one.save,true);phone.sync(restored);assert.equal(phone.sync(restored).phone.feed.filter(e=>e.id==='one').length,1);restored.mainId='successor';assert.deepEqual(phone.sync(restored).owner.threads,{});assert.equal(phone.contacts(restored).find(n=>n.id===npc.id).alive,false);console.log('Phone: live contacts, unique numbers, memorial preservation, unread state, history, reactions, sharing and generation separation passed.');

state.events.push(...Array.from({length:12},(_,i)=>({id:'comment-test-'+i,text:'event',time:i+10})));const posts=phone.sync(state).phone.feed;const comments=posts.flatMap(p=>phone.comments(state,p));assert(comments.length>0);assert(comments.every(c=>c.authorId!==npc.id&&c.authorId!==state.mainId));const snapshots=JSON.stringify(phone.sync(state).phone.feed.map(p=>p.npcComments));phone.sync(state);assert.equal(JSON.stringify(phone.sync(state).phone.feed.map(p=>p.npcComments)),snapshots);const savedComments=JSON.parse(JSON.stringify(state));assert.deepEqual(phone.comments(savedComments,posts.at(-1)),phone.sync(state).phone.feed.at(-1).npcComments);console.log('NPC comments persist across refreshes and saves; deceased residents do not create new comments.');

const now=Date.now(), fresh=sim.defaults(now), friend=fresh.npcs[0];
assert(phone.pending(fresh,sim,now).some(n=>n.id==='recruit'));
assert(phone.startTopic(fresh,friend.id,'hello',now));
assert.equal(phone.startTopic(fresh,friend.id,'duplicate',now),false);
for(let step=0;step<11;step++){assert(phone.replyTopic(fresh,friend.id,step%2,step,now+step+1));assert.equal(phone.replyTopic(fresh,friend.id,0,step),false)}
assert.equal(phone.sync(fresh).owner.threads[friend.id].length,24);
assert.equal(phone.topic(fresh,friend.id).active,false);
assert.equal(phone.sync(fresh).owner.threads[friend.id][0].text,'hello');
let recruitment=sim.prepareImmigration(fresh,now);const chosen=recruitment.immigration.candidates.slice(0,5);
assert(chosen.every(n=>Object.keys(n.attributes).length===9&&Object.values(n.attributes).every(v=>v>=20&&v<=100)));
const admitted=sim.admitResidents(recruitment,chosen.map(n=>n.id),now);assert(admitted.ok);assert.equal(sim.population(admitted.state),15);
assert.equal(phone.pending(admitted.state,sim,now).some(n=>n.id==='recruit'),false);
const restoredAdmission=JSON.parse(JSON.stringify(admitted.state));assert.deepEqual(sim.resident(restoredAdmission,chosen[0].id).attributes,chosen[0].attributes);
restoredAdmission.calendarTime=Date.UTC(sim.immigrationStatus(restoredAdmission,now).year+1,0,1);
assert(phone.pending(restoredAdmission,sim,now).some(n=>n.id==='recruit'));
admitted.state.npcs[0].alive=false;assert(phone.pending(admitted.state,sim,now).some(n=>n.id==='recruit'));
fresh.outing={id:'pending-one',mainId:fresh.mainId,npcId:friend.id,status:'travelling',place:'中心广场'};
assert(phone.pending(fresh,sim,now).some(n=>n.id==='outing:pending-one'));
fresh.outing.status='ready';assert(phone.pending(fresh,sim,now).some(n=>n.text==='朋友已经到达，点击继续活动。'));
fresh.outing=null;assert(!phone.pending(fresh,sim,now).some(n=>n.id.startsWith('outing:')));
const drawn=sim.drawLottery(fresh,now);assert(drawn.ok);assert(!phone.pending(drawn.state,sim,now).some(n=>n.id==='lottery'));
console.log('PASS: 24-message topics, stale choices, annual and low-population recruitment, attributes, actionable notifications and completed activity removal.');

for(let i=0;i<9;i++){const s=sim.defaults(now),n=s.npcs[i];assert(phone.startTopic(s,n.id,'start',now));let saved=JSON.parse(JSON.stringify(s));assert(phone.pending(saved,sim,now).some(p=>p.id==='chat:'+n.id));for(let step=0;step<11;step++)assert(phone.replyTopic(saved,n.id,1,step));assert.equal(phone.sync(saved).owner.threads[n.id].length,24);assert(!phone.pending(saved,sim,now).some(p=>p.id==='chat:'+n.id))}
const social=sim.defaults(now),author=social.npcs[0];social.events=[{id:'social-post',type:'activity',text:author.name+'在中心广场完成了休息。',time:now}];const rendered=phone.socialPost(social,phone.sync(social).phone.feed[0]);assert.equal(rendered.authorId,author.id);assert(!rendered.socialText.includes(social.events[0].text));assert(phone.react(social,'social-post','share'));assert(phone.socialPost(social,phone.sync(social).phone.feed.at(-1)).socialText);assert.equal(phone.socialPost(social,{type:'death',text:'system notice'}),null);
console.log('PASS nine saved conversations, first-person posts and sharing.');
