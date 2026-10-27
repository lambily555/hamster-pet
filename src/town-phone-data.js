(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TownPhoneData=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  function sync(state){
    const phone=state.phone||(state.phone={contacts:{},owners:{},feed:[]});
    const people=[{id:state.mainId,name:state.mainName,alive:state.alive},...state.npcs,...state.offspring,...state.npcOffspring];
    for(const n of people)if(n.id)phone.contacts[n.id]={...phone.contacts[n.id],id:n.id,number:phone.contacts[n.id]?.number||String(10001+Object.keys(phone.contacts).length),name:n.name,role:n.role||'',alive:n.alive!==false};
    for(const n of state.memorials||[])if(n.id)phone.contacts[n.id]={...phone.contacts[n.id],id:n.id,number:phone.contacts[n.id]?.number||String(10001+Object.keys(phone.contacts).length),name:n.name,role:n.role||'',alive:false};
    const owner=phone.owners[state.mainId]||(phone.owners[state.mainId]={threads:{},calls:[],reactions:{},seen:{chat:'',calls:'',feed:''}});
    const ids=new Map(phone.feed.map((e,i)=>[e.id,i]));for(const e of state.events||[]){const post={...e,authorId:e.mainId||'town'};if(ids.has(e.id))phone.feed[ids.get(e.id)]=post;else{ids.set(e.id,phone.feed.length);phone.feed.push(post)}}phone.feed=phone.feed.slice(-200);
    return {phone,owner};
  }
  function contacts(state){const {phone}=sync(state);return Object.values(phone.contacts).filter(n=>n.id!==state.mainId).sort((a,b)=>Number(b.alive)-Number(a.alive)||a.name.localeCompare(b.name))}
  function unread(state){const {phone,owner}=sync(state),key=contacts(state).map(n=>n.id+':'+n.alive).sort().join('|');return {chat:owner.seen.chat!==key,calls:owner.seen.calls!==key,feed:owner.seen.feed!==(phone.feed.at(-1)?.id||'')};}
  function read(state,app){const {phone,owner}=sync(state);owner.seen[app]=app==='feed'?(phone.feed.at(-1)?.id||''):contacts(state).map(n=>n.id+':'+n.alive).sort().join('|')}
  function send(state,id,line,reply,at=Date.now()){const {owner}=sync(state);if(!contacts(state).find(n=>n.id===id&&n.alive)||state.alive===false)return false;const thread=owner.threads[id]||(owner.threads[id]=[]);thread.push({from:'main',text:line,time:at},{from:id,text:reply,time:at+1});owner.threads[id]=thread.slice(-60);return true}
  function react(state,id,kind,text){const {phone,owner}=sync(state);if(!phone.feed.some(e=>e.id===id))return false;const r=owner.reactions[id]||(owner.reactions[id]={comments:[]});if(kind==='comment')r.comments.push({authorId:state.mainId,name:state.mainName,text});else if(kind==='share'){if(r.share)return false;r.share=true;const original=phone.feed.find(e=>e.id===id);phone.feed.push({id:'share:'+state.mainId+':'+id,authorId:state.mainId,time:Date.now(),calendarTime:state.calendarTime,text:original.text,shared:true});phone.feed=phone.feed.slice(-200)}else if(['like','save'].includes(kind))r[kind]=!r[kind];r.comments=r.comments.slice(-20);return true}
  return {sync,contacts,unread,read,send,react};
});
