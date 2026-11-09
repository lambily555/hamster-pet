(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TownPhoneData=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const stories=typeof module==='object'?require('./town-phone-stories.js'):TownPhoneStories;
  const personalities=typeof module==='object'?require('./town-personalities.js'):TownPersonalities;
  const opening='在吗？想找你聊会儿。';
  function topic(state,id){return sync(state).owner.topics?.[id]}
  function startTopic(state,id,opening,at=Date.now()){
    if(topic(state,id)?.active||!opening.trim()||!contacts(state).some(n=>n.id===id&&n.alive)||state.alive===false)return false;
    const {owner}=sync(state),story=stories.topics[personalities.index(id)%stories.topics.length];owner.topics||={};
    owner.topics[id]={story:story.id,step:0,active:true,startedAt:at};
    return send(state,id,'在吗？想找你聊会儿。',story.lines[0],at);
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
    const day=Math.floor((state.calendarTime||0)/86400000);
    if(phone.gamePostDay!==day){
      const residents=people.filter(n=>n.id&&n.id!==state.mainId&&n.alive!==false&&phone.contacts[n.id]?.alive);
      if(residents.length){const n=residents[day%residents.length],game=day%2?'runner':'shooter';phone.feed.push({id:'game:'+day,authorId:n.id,type:'game',game,time:Date.now(),calendarTime:state.calendarTime});phone.feed=phone.feed.slice(-200);phone.gamePostDay=day;}
    }
    return {phone,owner};
  }
  function contacts(state){const {phone}=sync(state);return Object.values(phone.contacts).filter(n=>n.id!==state.mainId).sort((a,b)=>Number(b.alive)-Number(a.alive)||a.name.localeCompare(b.name))}
  function unread(state){const {phone,owner}=sync(state),key=contacts(state).map(n=>n.id+':'+n.alive).sort().join('|');return {chat:owner.seen.chat!==key,calls:owner.seen.calls!==key,feed:owner.seen.feed!==(phone.feed.at(-1)?.id||'')};}
  function read(state,app){const {phone,owner}=sync(state);owner.seen[app]=app==='feed'?(phone.feed.at(-1)?.id||''):contacts(state).map(n=>n.id+':'+n.alive).sort().join('|')}
  function send(state,id,line,reply,at=Date.now()){const {owner}=sync(state);if(!contacts(state).find(n=>n.id===id&&n.alive)||state.alive===false)return false;const thread=owner.threads[id]||(owner.threads[id]=[]);thread.push({from:'main',text:line,time:at},{from:id,text:reply,time:at+1});owner.threads[id]=thread.slice(-60);return true}
  function react(state,id,kind,text){const {phone,owner}=sync(state);if(!phone.feed.some(e=>e.id===id))return false;const r=owner.reactions[id]||(owner.reactions[id]={comments:[]});if(kind==='comment')r.comments.push({authorId:state.mainId,name:state.mainName,text});else if(kind==='share'){if(r.share)return false;r.share=true;const original=phone.feed.find(e=>e.id===id),view=socialPost(state,original);phone.feed.push({socialText:view?.socialText,id:'share:'+state.mainId+':'+id,authorId:state.mainId,time:Date.now(),calendarTime:state.calendarTime,text:original.text,scenePlace:view?.scenePlace,game:view?.game,image:view?.image,customText:view?.customText,shared:true});phone.feed=phone.feed.slice(-200)}else if(['like','save'].includes(kind))r[kind]=!r[kind];r.comments=r.comments.slice(-20);return true}
  function hash(id){let n=0;for(const c of String(id))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n}
  function comments(state,post){
    const {phone}=sync(state);post=phone.feed.find(e=>e.id===post.id)||post;if(post.npcComments)return post.npcComments;
    const seed=hash(post.id),people=Object.values(phone.contacts).filter(n=>n.alive&&n.id!==state.mainId&&n.id!==post.authorId);
    post.npcComments=[];if(seed%3!==0&&people.length){const count=1+seed%2;for(let i=0;i<Math.min(count,people.length);i++){const n=people[(seed+i)%people.length];post.npcComments.push({authorId:n.id,name:n.name,text:['这热闹，我的腮帮子先来占个位。','已阅，瓜子都忘记嗑了。','好家伙，小镇今天又有节目看。','我带瓜子来了，继续讲。'][(seed+i)%4]})}}return post.npcComments;
  }
  function scenePlace(post){
    const names=['鼠鼠饭馆','鼠鼠学校','鼠鼠小屋','跑轮公园','零食铺','宠物之家','Mariah Carey名人堂','纪念馆','殡仪馆','墓地','小菜园','诊所','中心广场'];
    return names.find(name=>post.place===name||post.text?.includes(name))||({buy:'鼠鼠饭馆',study:'鼠鼠学校',rest:'鼠鼠小屋',family:'鼠鼠小屋',partner:'中心广场',social:'中心广场',game:'鼠鼠小屋'}[post.type])||'中心广场';
  }
  function socialPost(state,post){
    if(post.socialText&&(post.shared||post.type==='post'))return post;
    const {phone}=sync(state),people=Object.values(phone.contacts).sort((a,b)=>b.name.length-a.name.length);
    const author=phone.contacts[post.authorId]||people.find(n=>post.text?.startsWith(n.name));if(!author)return null;
    const lines={activity:'刚活动了一会儿，给自己留个记录。',buy:'饭吃过了，账也结清了。',rest:'先去补个觉，醒了再回消息。',study:'今天又学了一点，先记下来。',partner:'今天有伴侣了，以后是两只鼠一起过日子。',family:'家里有了新变化，这一天得记住。',social:'今天和朋友聊了聊，回来发个动态。'};
    const games={runner:['刚跳过一个坑，下一秒又掉进另一个。我这叫雨露均沾。','跑酷不用包场，整条赛道都在看我摔。','跑完一圈，建议先洗爪再碰瓜子。','早知这坑这么深，我就不跳了。','老铁，这腿归我管，落哪儿可不归我管。','哈哈哈哈，刚才那一跤不算，我笑得没按到跳。','今日运动：手指两公里，身体原地待命。','申请把坑填平，赛道说不接受调休。','说好最后一局。上一局也是这么说的。'],shooter:['子弹从耳边飞过，我的拖拉机正在办理退学。','装备可以买，走位这事管家暂时不会。','躲完弹幕再上厕所，别一紧张忘了冲水。','你只顾着瞄准，倒把我晾在弹幕里。','老铁别慌，先躲！不是让你往子弹上躲！','哈哈哈哈，敌人还没动，我先笑歪了准星。','战术很清楚：活着回来。执行起来另说。','这波不是失误，是给敌人一个就业机会。','眼睛看见了，爪子还在加载。']};
    if(post.type==='game'&&games[post.game])return {...post,scenePlace:scenePlace(post),socialText:games[post.game][personalities.index(author.id)%9]};
    const variants={activity:['出门溜达一圈，没办成大事，倒是把自己哄高兴了。','今天的运动量达标了：从窝走到饭桌。'],study:['学到了。会不会用，咱们下次再议。','脑袋今天上班了，先奖励它休息一会儿。'],rest:['今日营业结束，被窝已经给我留位了。','电量告急。不是手机，是我。']};
    const base=variants[post.type]?.[hash(post.id)%2]||lines[post.type];if(!base)return null;
    const voices=['顺便通知一下，枕头的拖拉机驾照到期了。','这条动态就不包金边了，管家还没下班。','刷到这里的朋友，记得洗手再吃东西。','也不知谁会惦记，倒是我先发出来了。','老铁们，今儿就先唠到这儿。','哈哈哈哈，先笑两声再发！','以上是本鼠口供，瓜子可以作证。','本条无需开会，看到算收到。','剩下的话等我充满电再说。'];
    return {...post,scenePlace:scenePlace(post),authorId:author.id,socialText:base+' '+voices[personalities.index(author.id)%voices.length]};
  }
  function publish(state,text,game=null,image=null,at=Date.now()){
    if(state.alive===false||!String(text).trim())return false;
    const {phone}=sync(state);phone.postSequence=(phone.postSequence||0)+1;
    phone.feed.push({id:'post:'+state.mainId+':'+phone.postSequence,authorId:state.mainId,type:'post',socialText:String(text).trim().slice(0,300),customText:true,game:['runner','shooter'].includes(game)?game:null,image:typeof image==='string'&&/^data:image\/jpeg;base64,/.test(image)&&image.length<100000?image:null,time:at,calendarTime:state.calendarTime});
    phone.feed=phone.feed.slice(-200);let photos=0;for(let i=phone.feed.length-1;i>=0;i--)if(phone.feed[i].image&&++photos>12)delete phone.feed[i].image;
    return true;
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
  return {scenePlace,publish,opening,socialPost,topic,startTopic,replyTopic,pending,sync,contacts,unread,read,send,react,hash,comments};
});
