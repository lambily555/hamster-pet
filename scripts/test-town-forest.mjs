import assert from 'node:assert/strict';
import {createTownLife,destinations,entrance,route,blocked} from '../src/town-life.js';
for(const d of destinations){const path=route(entrance(d[0]),entrance('知识森林'));assert.ok(path.length,d[0]+' can reach forest');assert.ok(path.every(p=>!blocked(p.x,p.z)))}
const events=[],life=createTownLife(e=>events.push(e));const main=life.add('main','鼠鼠小屋'),adult=life.add('adult','鼠鼠小屋'),child=life.add('child','鼠鼠小屋',{child:true,age:.3});
// A normal daily cycle sends adults and mobile juveniles to the forest.
let allVisited=false;for(let i=0;i<6000;i++){life.tick(1);if([...life.actors.values()].every(a=>a.visited.has('知识森林'))){allVisited=true;break}}
assert.ok(allVisited,'main, adult and juvenile can visit and finish forest exploration');assert.ok(events.some(e=>e.place==='知识森林'&&e.type==='activity'));
const paused=createTownLife();const player=paused.add('main','鼠鼠小屋'),visitor=paused.add('npc','鼠鼠小屋');visitor.cycle=14;const initial={...player.position};let entered=false,left=false;for(let i=0;i<600;i++){paused.tick(1,true,'main');if(visitor.inside==='知识森林')entered=true;if(entered&&!visitor.inside&&visitor.visited.has('知识森林')){left=true;break}}
assert.ok(entered&&left,'NPC visits and leaves while player explores');assert.deepEqual(player.position,initial);assert.equal(player.cycle,0);assert.equal(player.energySeconds,undefined);
console.log('PASS forest routes, main/adult/juvenile visits, completion and return, NPC simulation during manual exploration without moving or draining the player');
