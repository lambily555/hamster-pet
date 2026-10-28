(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TownPhoneData=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const stories=typeof module==='object'?require('./town-phone-stories.js'):TownPhoneStories;
  const personalities=typeof module==='object'?require('./town-personalities.js'):TownPersonalities;
  function topic(state,id){return sync(state).owner.topics?.[id]}
  function startTopic(state,id,opening,at=Date.now()){
    if(topic(state,id)?.active||!opening.trim()||!contacts(state).some(n=>n.id===id&&n.alive)||state.alive===false)return false;
    const {owner}=sync(state),story=stories.topics[personalities.index(id)%stories.topics.length];owner.topics||={};
    owner.topics[id]={story:story.id,step:0,active:true,startedAt:at};
    return send(state,id,opening.trim().slice(0,160),story.lines[0],at);
  }
  function replyTopic(state,id,choice,step,at=Date.now()){
    const session=topic(state,id);if(!session?.active||session.step!==step||![0,1,2].includes(choice))return false;
    const story=stories.topics.find(s=>s.id===session.story);if(!story)return false;
    const text=choice===2?'先离开一会儿':stories.choices[step][choice],reply=choice===2?'好，你先忙，回头再聊。':story.lines[step+1];
    if(!send(state,id,text,reply,at))return false;
    session.step++;session.active=choice!==2&&session.step<story.lines.length-1;return true;
  }
  function sync(state){
    const phone=state.phone||(state.phone={contacts:{},owners:{},feed:[]});
    const people=[{id:state.mainId,name:state.mainName,coat:state.mainCoat,alive:state.alive},...state.npcs,...state.offspring,...state.npcOffspring];
    for(const n of people)if(n.id)phone.contacts[n.id]={...phone.contacts[n.id],id:n.id,number:phone.contacts[n.id]?.number||String(10001+Object.keys(phone.contacts).length),name:n.name,coat:n.coat||'three-line',role:n.role||'',alive:n.alive!==false};
    for(const n of state.memorials||[])if(n.id)phone.contacts[n.id]={...phone.contacts[n.id],id:n.id,number:phone.contacts[n.id]?.number||String(10001+Object.keys(phone.contacts).length),name:n.name,role:n.role||'',alive:false};
    const owner=phone.owners[state.mainId]||(phone.owners[state.mainId]={threads:{},calls:[],reactions:{},seen:{chat:'',calls:'',feed:''}});
    const ids=new Map(phone.feed.map((e,i)=>[e.id,i]));for(const e of state.events||[]){const post={...e,authorId:e.mainId||'town'};if(ids.has(e.id))phone.feed[ids.get(e.id)]={...phone.feed[ids.get(e.id)],...post};else{ids.set(e.id,phone.feed.length);phone.feed.push(post)}}phone.feed=phone.feed.slice(-200);
    return {phone,owner};
  }
  function contacts(state){const {phone}=sync(state);return Object.values(phone.contacts).filter(n=>n.id!==state.mainId).sort((a,b)=>Number(b.alive)-Number(a.alive)||a.name.localeCompare(b.name))}
  function unread(state){const {phone,owner}=sync(state),key=contacts(state).map(n=>n.id+':'+n.alive).sort().join('|');return {chat:owner.seen.chat!==key,calls:owner.seen.calls!==key,feed:owner.seen.feed!==(phone.feed.at(-1)?.id||'')};}
  function read(state,app){const {phone,owner}=sync(state);owner.seen[app]=app==='feed'?(phone.feed.at(-1)?.id||''):contacts(state).map(n=>n.id+':'+n.alive).sort().join('|')}
  function send(state,id,line,reply,at=Date.now()){const {owner}=sync(state);if(!contacts(state).find(n=>n.id===id&&n.alive)||state.alive===false)return false;const thread=owner.threads[id]||(owner.threads[id]=[]);thread.push({from:'main',text:line,time:at},{from:id,text:reply,time:at+1});owner.threads[id]=thread.slice(-60);return true}
  function react(state,id,kind,text){const {phone,owner}=sync(state);if(!phone.feed.some(e=>e.id===id))return false;const r=owner.reactions[id]||(owner.reactions[id]={comments:[]});if(kind==='comment')r.comments.push({authorId:state.mainId,name:state.mainName,text});else if(kind==='share'){if(r.share)return false;r.share=true;const original=phone.feed.find(e=>e.id===id),view=socialPost(state,original);phone.feed.push({socialText:view?.socialText,id:'share:'+state.mainId+':'+id,authorId:state.mainId,time:Date.now(),calendarTime:state.calendarTime,text:original.text,shared:true});phone.feed=phone.feed.slice(-200)}else if(['like','save'].includes(kind))r[kind]=!r[kind];r.comments=r.comments.slice(-20);return true}
  function hash(id){let n=0;for(const c of String(id))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n}
  function comments(state,post){
    const {phone}=sync(state);post=phone.feed.find(e=>e.id===post.id)||post;if(post.npcComments)return post.npcComments;
    const seed=hash(post.id),people=Object.values(phone.contacts).filter(n=>n.alive&&n.id!==state.mainId&&n.id!==post.authorId);
    post.npcComments=[];if(seed%3!==0&&people.length){const count=1+seed%2;for(let i=0;i<Math.min(count,people.length);i++){const n=people[(seed+i)%people.length];post.npcComments.push({authorId:n.id,name:n.name,text:['这热闹，我的腮帮子先来占个位。','已阅，瓜子都忘记嗑了。','好家伙，小镇今天又有节目看。','我带瓜子来了，继续讲。'][(seed+i)%4]})}}return post.npcComments;
  }
  function socialPost(state,post){
    if(post.shared&&post.socialText)return post;
    const {phone}=sync(state),people=Object.values(phone.contacts).sort((a,b)=>b.name.length-a.name.length);
    const author=phone.contacts[post.authorId]||people.find(n=>post.text?.startsWith(n.name));if(!author)return null;
    const lines={activity:'刚活动了一会儿，给自己留个记录。',buy:'饭吃过了，账也结清了。',rest:'先去补个觉，醒了再回消息。',study:'今天又学了一点，先记下来。',partner:'今天有伴侣了，以后是两只鼠一起过日子。',family:'家里有了新变化，这一天得记住。',social:'今天和朋友聊了聊，回来发个动态。'};
    const base=lines[post.type];if(!base)return null;
    const voices=['顺便通知一下，枕头的拖拉机驾照到期了。','这条动态就不包金边了，管家还没下班。','刷到这里的朋友，记得洗手再吃东西。','也不知谁会惦记，倒是我先发出来了。','老铁们，今儿就先唠到这儿。','哈哈哈哈，先笑两声再发！','以上是本鼠口供，瓜子可以作证。','本条无需开会，看到算收到。','剩下的话等我充满电再说。'];
    return {...post,authorId:author.id,socialText:base+' '+voices[personalities.index(author.id)%voices.length]};
  }
  function pending(state,sim,at=Date.now()){
    const items=[];
    if(state.alive===false)items.push({id:'successor',title:'选择下一代主鼠',text:'点击继续挑选接任的鼠鼠。'});
    if(state.alive!==false)for(const [id,session] of Object.entries(sync(state).owner.topics||{}))if(session.active&&contacts(state).some(n=>n.id===id&&n.alive))items.push({id:'chat:'+id,title:'聊天鼠',text:'还有没聊完的话题，点击继续。',place:sync(state).phone.contacts[id].name});
    if(sim.immigrationStatus(state,at).available)items.push({id:'recruit',title:'挑选新邻居',text:'招募名额还在，点击继续挑选五位新邻居。'});
    const outing=state.outing;
    if(state.alive!==false&&outing&&outing.mainId===state.mainId&&contacts(state).some(n=>n.id===outing.npcId&&n.alive))items.push({id:'outing:'+outing.id,title:'结伴活动',text:outing.status==='ready'?'朋友已经到达，点击继续活动。':'正在赶往约定地点，点击查看进度。',place:outing.place});
    if(state.alive!==false&&sim.lotteryStatus(state,at).available)items.push({id:'lottery',title:'每日抽奖',text:'今天还没抽奖，点击前往老虎机。'});
    return items;
  }
  return {socialPost,topic,startTopic,replyTopic,pending,sync,contacts,unread,read,send,react,hash,comments};
});
