const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{constructor(){this.hidden=false;this.textContent='';this.children=[];this.style={};this.dataset={};}appendChild(x){this.children.push(x)}replaceChildren(){this.children=[]}querySelector(s){if(s==='p')return line;if(s==='div')return choices;if(s==='.town-dialogue-choices button')return choices.children[0]||null;return null}closest(){return null}}
const line=new Element(),choices=new Element(),floating=new Element(),events={},nodes={};floating.hidden=true;
const story={id:'outing-test',npcId:'npc',status:'ready',storyIndex:0,questionIndex:0,questionCount:3,options:[{text:'A'},{text:'B'},{text:'C'}]};let resolved=0;
const context={console,Date,setInterval:()=>1,clearInterval:()=>{},TownI18n:{t:s=>s},townState:{outing:story},document:{body:{dataset:{}},createElement:()=>new Element(),exitPointerLock:()=>{}},window:{addEventListener:(name,fn)=>events[name]=fn},$ : id=>nodes[id]||(nodes[id]=new Element()),saveTown:()=>{},renderTown:()=>{},townSim:{outingChoices:()=>story.options,mainSleeping:()=>false,resident:()=>({name:'芝麻'}),outingStories:[['Question']],resolveOuting:(state,id,i)=>{resolved++;const next={...state.outing,questionIndex:state.outing.questionIndex+1};return {ok:true,state:{outing:resolved>=3?null:next},message:'芝麻：Response',finished:resolved>=3}}}};
vm.createContext(context);
const source=fs.readFileSync('src/dashboard.js','utf8'),start=source.indexOf('let dialogueTimer=0,'),end=source.indexOf("window.addEventListener('town-outing-open'",start);
context.floatingDialogue=floating;vm.runInContext(source.slice(start,end),context);
const run=s=>vm.runInContext(s,context),event=(key,target=new Element(),repeat=false)=>({key,target,repeat,preventDefault(){},stopImmediatePropagation(){}});
run('openOutingDialogue()');assert.equal(choices.children.length,0);
events.keydown(event('a'));assert.equal(line.textContent,'芝麻：Question');assert.equal(choices.children.length,3);
events.click(event());assert.equal(resolved,0);assert.equal(choices.children.length,3);
for(let n=0;n<3;n++){
 choices.children[0].onclick({stopPropagation(){}});assert.equal(resolved,n+1);assert.equal(choices.children.length,0);
 events.keydown(event('a',new Element(),true));assert.equal(line.textContent,'');
 events.click(event());assert.equal(line.textContent,'芝麻：Response'+(n===2?'\n\n本次鼠鼠会谈正式散场，剩下的话题先塞进腮帮子，下次见面接着聊。':''));assert.equal(choices.children.length,0);
 events.keydown(event(' '));
 if(n<2){assert.equal(floating.hidden,false);events.keydown(event('Enter'));assert.equal(choices.children.length,3);}
}
assert.equal(floating.hidden,true);assert.equal(context.document.body.dataset.townDialogue,undefined);
run('advanceFloatingDialogue()');assert.equal(resolved,3);
console.log('PASS dialogue: name/question, three choices, typewriter skip, click/key advance, repeat guard, three rounds and close; no continue button');

context.TownPersonalities={line:()=> 'Question'};context.townState={alive:true,social:{total:0}};context.townSim.interact=state=>{resolved++;return {ok:true,state,message:'Affection +5'}};const before=resolved;run("openSocialDialogue('npc')");events.keydown(event('a'));assert.equal(choices.children.length,3);assert.equal(choices.children[2].textContent,'先离开一会儿');choices.children[2].onclick({stopPropagation(){}});assert.equal(resolved,before);assert.equal(floating.hidden,true);run("openSocialDialogue('npc')");events.keydown(event('a'));const answer=choices.children[1];answer.onclick({stopPropagation(){}});answer.onclick({stopPropagation(){}});assert.equal(resolved,before+1);events.keydown(event('a'));events.keydown(event('a'));assert.equal(floating.hidden,true);console.log('PASS social: three choices, free exit, one settlement on repeated click');
