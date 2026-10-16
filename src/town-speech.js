// Display current speech only; never queue old ambient lines for later playback.
export function createSpeechDirector(){
 const states=new Map();let gaze=null,gazeSince=0;
 const hash=id=>[...id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
 const overlaps=(a,b)=>a.left<b.right+8&&a.right>b.left-8&&a.top<b.bottom+8&&a.bottom>b.top-8;
 return {update(candidates,{now,firstPerson=false,limit=firstPerson?3:4,gazeId=null}={}){
  if(gazeId!==gaze){gaze=gazeId;gazeSince=now}
  const ids=new Set(candidates.map(c=>c.id));for(const id of states.keys())if(!ids.has(id))states.delete(id);
  for(const c of candidates){let s=states.get(c.id);if(!s){s={text:c.text,until:0,ready:now+(hash(c.id)%1500)/1000,last:-Infinity};states.set(c.id,s)}if(s.text!==c.text){s.text=c.text;s.until=0;s.ready=now+(hash(c.id)%700)/1000}}
  const looking=gaze&&now-gazeSince>=.45?gaze:null,rank=c=>c.urgent?3:c.id===looking?2:states.get(c.id).until>now?1:0;
  const ordered=[...candidates].sort((a,b)=>rank(b)-rank(a)||states.get(a.id).last-states.get(b.id).last||(a.distance-b.distance)||hash(a.id)-hash(b.id));
  const full=new Set(),occupied=[],texts=new Set();
  for(const c of ordered){const s=states.get(c.id),priority=c.urgent||c.id===looking;if(full.size>=limit||!c.rect||c.rect.top<8||c.rect.bottom>c.viewHeight-8||c.rect.left<8||c.rect.right>c.viewWidth-8)continue;if(!priority&&(now<s.ready&&s.until<=now||firstPerson&&c.distance>5||texts.has(c.text)))continue;if(occupied.some(r=>overlaps(c.rect,r)))continue;
   full.add(c.id);occupied.push(c.rect);texts.add(c.text);if(s.until<=now){s.until=now+3.6;s.ready=s.until+6+(hash(c.id)%3000)/1000;s.last=now}
  }
  return candidates.map(c=>({id:c.id,mode:full.has(c.id)?'full':'hint',text:full.has(c.id)?c.text:'···'}));
 }};
}
