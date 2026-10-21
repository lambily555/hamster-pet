import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPetCompanions} from '../src/town-pet-companions.js';
import {freePetSlot} from '../src/town-pet-layout.js';
for(const count of [1,3,12,30]){
 const scene=new THREE.Scene(),room=new THREE.Group();room.visible=true;room.scale.set(.475,.475,.4667);room.position.set(2,.12,3);room.updateMatrixWorld(true);const rooms=new Map([['宠物之家',room]]),pets=createPetCompanions({scene,rooms,models:new Map(),clickable:[]});
 const state={alive:true,petHome:{pets:[],follow:true,npcPets:Array.from({length:count},(_,i)=>({id:'free-'+i,species:'cat',fostered:true,ownerId:null,follow:false}))}};
 const leader={position:{x:8,z:8},heading:0,inside:null};pets.sync(state);
 for(let step=0;step<40;step++){leader.position.x+=.1;pets.tick(.1,leader,state,null,false,new Map());for(const [i,p] of pets.inspect().entries()){assert.equal(p.inside,'宠物之家');assert.ok(p.position.x>-3.55&&p.position.x< -1.15);assert.ok(p.position.z>-.95&&p.position.z<-.35,'pets stay behind the sign');assert.ok(p.worldPosition.every(Number.isFinite));assert.equal(p.moving,false);assert.deepEqual(p.position,{x:freePetSlot(i,count).x,z:freePetSlot(i,count).z})}}
 if(count===1){const pet=state.petHome.npcPets.pop();delete pet.fostered;pet.ownerId='chosen-npc';pet.follow=true;state.petHome.npcPets.push(pet);pets.sync(state);const npc={position:{x:5,z:5},heading:0,inside:null};pets.tick(.1,leader,state,null,false,new Map([['chosen-npc',npc]]));assert.equal(pets.inspect()[0].ownerId,'chosen-npc');assert.equal(pets.inspect()[0].inside,null,'only adopted pet leaves the display area')}
}
console.log('Free pets remain finite and stationary behind the sign across reloads and leader movement; adoption unlocks following.');
