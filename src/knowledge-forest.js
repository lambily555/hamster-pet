import * as THREE from 'three';
import {glades,questions,sources,cleanProgress,recordAnswer} from './forest-knowledge.js';
import {worldMaterial,applyWorldSurface} from './town-world-surfaces.js';

const copy={
  title:['知识森林','Forest of Knowledge','Bosque del conocimiento'],
  field:['森林观察手记 / 01','FOREST FIELD NOTES / 01','CUADERNO DEL BOSQUE / 01'],
  subtitle:['把小常识，走成一片森林。','Little discoveries. A whole forest.','Pequeños descubrimientos. Todo un bosque.'],
  enter:['探索知识森林','Explore the forest','Explorar el bosque'],
  back:['返回小镇','Back to town','Volver al pueblo'],
  walk:['第一视角','First person','Primera persona'],
  map:['俯瞰地图','Forest map','Mapa del bosque'],
  journal:['知识手册','Field journal','Cuaderno de campo'],
  leaves:['知识叶片','Knowledge leaves','Hojas de conocimiento'],
  hint:['点击林间营地开始探索 · 方向键也可选择营地','Select a forest camp to explore · Arrow keys select a camp too','Elige un campamento · También puedes usar las flechas'],
  walkHint:['WASD / 方向键行走 · 拖动画面转向 · 靠近营地按 E','WASD / arrows to walk · Drag to look · E near a camp','WASD / flechas para caminar · Arrastra para mirar · E junto a un campamento'],
  start:['和向导聊聊','Talk to the guide','Hablar con el guía'],
  close:['收起','Close','Cerrar'],
  next:['下一题','Next question','Siguiente pregunta'],
  retry:['再想一想','Try again','Intentar de nuevo'],
  correct:['叶片收好，这次真的学会了！','A new leaf of knowledge. Nicely done!','¡Una hoja de conocimiento! Muy bien.'],
  incorrect:['差一点，听听向导怎么说。','Not quite. Here is the guide’s explanation.','Casi. Escucha la explicación del guía.'],
  done:['这片林地学完啦，去下一站散散步。','This clearing is complete. Take a stroll to the next one.','Has completado este claro. Pasea hasta el siguiente.'],
  complete:['知识树已点亮 · 森林小小守护者','Knowledge tree awakened · Forest Guardian','Árbol del saber iluminado · Guardián del bosque'],
  source:['知识来源','Care reference','Fuente'],
  empty:['还没有叶片。先找一位向导聊聊吧。','No leaves yet. Meet a guide to get started.','Aún no tienes hojas. Visita a un guía.'],
  note:['小镇是拟人游戏；现实照护以动物福利和兽医建议为准。','The town is fictional. Follow animal-welfare guidance and veterinary advice for real pets.','El pueblo es ficticio. Para mascotas reales, sigue las pautas de bienestar y el consejo veterinario.'],
  storage:['进度暂时无法保存，本次仍可继续学习。','Progress could not be saved. You can still keep learning.','No se pudo guardar el progreso. Puedes seguir aprendiendo.'],
  error:['森林加载失败，请返回小镇后重试。','The forest could not load. Return to town and try again.','El bosque no se ha cargado. Vuelve al pueblo e inténtalo de nuevo.']
};
const language=()=>({zh:0,en:1,es:2}[window.TownI18n?.language]??0);
const tr=key=>copy[key][language()];
const localized=value=>value[language()];
const key='shushu.knowledge-forest.v1';

export function installKnowledgeForest(){
  if(document.getElementById('forestEntry'))return;
  const toolbar=document.querySelector('.town-cards');if(!toolbar)return;
  const entry=document.createElement('button');entry.id='forestEntry';entry.setAttribute('data-i18n-user','');entry.type='button';entry.textContent=tr('enter');toolbar.appendChild(entry);
  const overlay=document.createElement('section');overlay.id='knowledgeForest';overlay.setAttribute('data-i18n-user','');overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',tr('title'));overlay.tabIndex=-1;
  overlay.innerHTML='<canvas class="forest-canvas"></canvas><div class="forest-header"><div><small>FOREST FIELD NOTES / 01</small><h1></h1><p></p></div><button data-action="exit"></button></div><div class="forest-tools"><span class="forest-progress"></span><button data-action="view"></button><button data-action="journal"></button></div><nav class="forest-stations"></nav><div class="forest-caption"></div><div class="forest-touch"><button data-move="forward">↑</button><button data-move="left">←</button><button data-move="back">↓</button><button data-move="right">→</button><button data-action="interact">E</button></div><section class="forest-card" hidden></section><div class="forest-toast" role="status"></div>';
  document.body.appendChild(overlay);
  const canvas=overlay.querySelector('canvas'),card=overlay.querySelector('.forest-card'),toast=overlay.querySelector('.forest-toast');
  let progress=cleanProgress(null);try{progress=cleanProgress(JSON.parse(localStorage.getItem(key)||'null'))}catch{}
  let draw=null,scene=null,camera=null,frame=0,resize=null,clock=0,mode='map',yaw=0,drag=null,active=-1,question=null,answered=false,view='map',lastFocus=null,toastTimer=0;
  const keys=new Set(),player=new THREE.Vector3(0,.1,10),colliders=[],markers=[],decorations=[],look=new THREE.Vector3(),raycaster=new THREE.Raycaster();
  const targetCamera=new THREE.Vector3(20,25,29),targetLook=new THREE.Vector3(0,0,-1);
  let avatar=null,treeCrown=null;
  function notify(text){toast.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.textContent='',4500)}
  function save(){try{localStorage.setItem(key,JSON.stringify(progress))}catch{notify(tr('storage'))}}
  function button(label,fn,className=''){const el=document.createElement('button');el.type='button';el.textContent=label;el.className=className;el.onclick=fn;return el}
  function count(g){return questions.filter(q=>q.glade===g.id&&progress.learned.includes(q.id)).length}
  function refresh(){
    entry.textContent=tr('enter');if(overlay.hidden)return;
    overlay.setAttribute('aria-label',tr('title'));overlay.querySelector('.forest-header small').textContent=tr('field');overlay.querySelector('h1').textContent=tr('title');overlay.querySelector('.forest-header p').textContent=tr('subtitle');
    overlay.querySelector('[data-action="exit"]').textContent='← '+tr('back');overlay.querySelector('[data-action="view"]').textContent=tr(mode==='map'?'walk':'map');overlay.querySelector('[data-action="journal"]').textContent=tr('journal');
    overlay.querySelector('.forest-progress').textContent=`✦ ${progress.learned.length} / ${questions.length} · ${tr('leaves')}`;
    overlay.querySelector('.forest-caption').textContent=progress.learned.length===questions.length?tr('complete'):tr(mode==='map'?'hint':'walkHint');
    overlay.querySelector('.forest-touch').hidden=mode!=='walk';const nav=overlay.querySelector('nav');nav.replaceChildren();
    glades.forEach((g,i)=>{const b=button(`${String(i+1).padStart(2,'0')}  ${localized(g.name)}  ${count(g)}/3`,()=>select(i));b.classList.toggle('learned',count(g)===3);b.classList.toggle('active',active===i);nav.appendChild(b)});
    if(treeCrown){treeCrown.material.emissive.setHex(progress.learned.length===questions.length?0xffcd63:0x234f31);treeCrown.material.emissiveIntensity=progress.learned.length===questions.length?.45:.08}
  }
  function panel(title){card.replaceChildren();card.hidden=false;const header=document.createElement('div'),h=document.createElement('h2');header.className='forest-card-head';h.textContent=title;header.append(h,button('×',closeCard));header.lastChild.setAttribute('aria-label',tr('close'));card.append(header);keys.clear();return card}
  function paragraph(text,className=''){const p=document.createElement('p');p.textContent=text;p.className=className;card.appendChild(p);return p}
  function closeCard(){card.hidden=true;view='map';question=null;keys.clear();overlay.focus({preventScroll:true})}
  function select(i){
    active=i;refresh();const g=glades[i];
    if(mode==='walk'&&Math.hypot(player.x-g.x,player.z-g.z)>3.5){notify(localized(g.name)+' · '+tr('walkHint'));return}
    if(mode==='map'){targetLook.set(g.x,.5,g.z);targetCamera.set(g.x+7,10,g.z+11)}
    const available=questions.filter(q=>q.glade===g.id);showQuestion(available.find(q=>!progress.learned.includes(q.id))||available[0]);
  }
  function showQuestion(q){
    question=q;view='quiz';answered=false;const g=glades.find(g=>g.id===q.glade),group=questions.filter(item=>item.glade===g.id);
    panel(localized(g.guide)+' · '+localized(g.name));paragraph(`${group.indexOf(q)+1} / ${group.length}`,'forest-eyebrow');paragraph(localized(q.q),'forest-question');
    const options=document.createElement('div');options.className='forest-options';q.answers.forEach((answer,i)=>options.appendChild(button(`${String.fromCharCode(65+i)}  ${localized(answer)}`,()=>answerQuestion(i))));card.append(options);card.querySelector('.forest-options button').focus({preventScroll:true});
  }
  function answerQuestion(choice){
    if(answered||!question)return;answered=true;const q=question,correct=recordAnswer(progress,q.id,choice);if(correct)save();refresh();
    const buttons=[...card.querySelectorAll('.forest-options button')];buttons.forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===q.correct);b.classList.toggle('incorrect',i===choice&&!correct)});
    const feedback=paragraph(tr(correct?'correct':'incorrect'),'forest-feedback');feedback.setAttribute('role','status');paragraph(localized(q.explanation));paragraph(`${tr('source')}: ${sources[q.source][0]}`,'forest-source');
    const list=questions.filter(item=>item.glade===q.glade),index=list.indexOf(q);
    const next=button(tr(correct?'next':'retry'),()=>{if(!correct){showQuestion(q);return}if(index<list.length-1){showQuestion(list[index+1]);return}closeCard();notify(tr('done'));if(mode==='map'){targetCamera.set(20,25,29);targetLook.set(0,0,-1)}},'forest-primary');card.append(next);next.focus({preventScroll:true});
  }
  function journal(){view='journal';panel(tr('journal'));paragraph(tr('note'));if(!progress.learned.length)paragraph(tr('empty'));
    for(const q of questions.filter(q=>progress.learned.includes(q.id))){const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('p');summary.textContent=localized(q.q);body.textContent=localized(q.explanation);details.append(summary,body);card.append(details)}
    paragraph(tr('source'),'forest-eyebrow');sources.forEach(([name,url])=>{const p=paragraph(name+': '+url,'forest-source');p.style.overflowWrap='anywhere'});
  }
  function mesh(geometry,color,x,y,z,parent=scene){
    const kind=[0x79583d,0x826345].includes(color)?'bark':[0x98794e,0xc9ab77,0xa08355,0x926a43,0xa88253,0xa7824f,0x846344].includes(color)?'wood':color===0x8b9c69?'grass':color===0x8b7252?'soil':[0xd9c49b,0xc6ba8d].includes(color)?'gravel':[0x587e4c,0x6f9053,0x486e4c,0x89a95e,0xaac37a,0x729852].includes(color)?'foliage':null;
    const material=kind?worldMaterial(kind,color):new THREE.MeshStandardMaterial({color,roughness:.9}),m=new THREE.Mesh(geometry,material);if(kind){applyWorldSurface(m,kind);if(m.geometry!==geometry)geometry.dispose()}m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,color,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent)}
  function sphere(r,color,x,y,z,parent){return mesh(new THREE.IcosahedronGeometry(r,1),color,x,y,z,parent)}
  function guide(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);sphere(.42,color,0,.5,0,g).scale.set(.85,1,.72);sphere(.32,color,0,.94,0,g);[-1,1].forEach(s=>{sphere(.16,color,s*.23,1.17,0,g);sphere(.105,0xe9b3a3,s*.23,1.17,.1,g);sphere(.047,0x332820,s*.12,1,.26,g);sphere(.1,color,s*.19,.13,.1,g)});sphere(.045,0xb67161,0,.91,.31,g);return g}
  function tree(x,z,size=1,color=0x587e4c){box(.38*size,2*size,.38*size,0x79583d,x,size,z);sphere(1.35*size,color,x,2.4*size,z);sphere(.95*size,color,x-.5*size,3.2*size,z);colliders.push({x,z,r:.5*size})}
  function makeScene(){
    if(!draw)draw=new THREE.WebGLRenderer({canvas,antialias:true});draw.setPixelRatio(Math.min(devicePixelRatio,1.5));draw.toneMapping=THREE.ACESFilmicToneMapping;draw.shadowMap.enabled=true;draw.shadowMap.type=THREE.PCFSoftShadowMap;draw.shadowMap.autoUpdate=false;
    scene=new THREE.Scene();scene.background=new THREE.Color(0xdbe7cd);scene.fog=new THREE.Fog(0xdbe7cd,32,65);camera=new THREE.PerspectiveCamera(43,1,.1,90);camera.position.copy(targetCamera);look.copy(targetLook);
    scene.add(new THREE.HemisphereLight(0xfff5de,0x738768,2.4));const sun=new THREE.DirectionalLight(0xffe6b1,3.2);sun.position.set(-10,25,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21});sun.shadow.normalBias=.04;scene.add(sun);
    mesh(new THREE.CylinderGeometry(16,16.6,.8,64),0x8b9c69,0,-.45,0);mesh(new THREE.CylinderGeometry(16.7,17,1,64),0x8b7252,0,-1.3,0);
    const pathPoints=[new THREE.Vector3(0,.035,12),...glades.map(g=>new THREE.Vector3(g.x,.035,g.z)),new THREE.Vector3(0,.035,12)];
    const curve=new THREE.CatmullRomCurve3(pathPoints);for(let i=0;i<120;i++){const v=curve.getPoint(i/119);mesh(new THREE.CylinderGeometry(.8,.8,.045,12),0xd9c49b,v.x,.03,v.z)}
    // Shallow pond has a solid bank; the footbridge is a continuous walkable surface.
    const pond=mesh(new THREE.CylinderGeometry(2.3,2.3,.035,40),0x77ada5,3,.035,7);pond.scale.z=.6;colliders.push({x:3,z:7,r:2.35});
    for(let i=0;i<12;i++)box(.32,.15,1.5,0x98794e,1.05+i*.36,.17,7);
    for(const z of [6.25,7.75]){box(4.3,.1,.1,0xc9ab77,3,.85,z);for(const x of [1,3,5])box(.1,.9,.1,0xa08355,x,.5,z)}
    for(let i=0;i<34;i++){const a=i*Math.PI*2/34,r=14.2+(i%3)*.25;tree(Math.cos(a)*r,Math.sin(a)*r,.7+(i%4)*.13,[0x587e4c,0x6f9053,0x486e4c][i%3])}
    for(const [x,z] of [[-11,0],[11,0],[-3,-12],[3,-12],[-11,8],[10,9]])tree(x,z,.8);
    box(1.5,4,1.3,0x826345,0,2,-1);treeCrown=sphere(3.1,0x89a95e,0,5,-1);sphere(2.2,0xaac37a,-1.8,4.5,-1);sphere(2.2,0x729852,1.8,4.8,-1);colliders.push({x:0,z:-1,r:1.45});
    const ring=mesh(new THREE.TorusGeometry(1.7,.12,8,40),0xe6c881,0,.22,-1);ring.rotation.x=Math.PI/2;
    glades.forEach((g,i)=>{mesh(new THREE.CylinderGeometry(2.1,2.2,.12,28),0xc6ba8d,g.x,.06,g.z);const m=mesh(new THREE.CylinderGeometry(.85,.95,.35,24),g.color,g.x,.25,g.z);m.userData.station=i;markers.push(m);const npc=guide(g.x,g.z,g.color);decorations.push(npc);
      box(1.45,.14,.58,0x926a43,g.x-1.1,.6,g.z-.8);box(.15,.7,.15,0x79583d,g.x-1.6,.3,g.z-.8);box(.15,.7,.15,0x79583d,g.x-.6,.3,g.z-.8);
      colliders.push({x:g.x-1.1,z:g.z-.8,r:.9});colliders.push({x:g.x,z:g.z,r:.65});
      if(i===0){for(let n=0;n<5;n++)sphere(.15,0xe5bf65,g.x-1.5+n*.2,.8,g.z-.8)}
      if(i===1){box(1.4,.8,1.1,0xa88253,g.x+1,.5,g.z-1);const roof=mesh(new THREE.ConeGeometry(1.2,.8,4),0x75814d,g.x+1,1.25,g.z-1);roof.rotation.y=Math.PI/4;colliders.push({x:g.x+1,z:g.z-1,r:1})}
      if(i===2){const moon=mesh(new THREE.TorusGeometry(.45,.13,8,24,Math.PI*1.5),0xffe6a3,g.x,2.5,g.z-1);moon.rotation.z=-.7;box(.08,2,.08,0x8f7753,g.x,1,g.z-1)}
      if(i===3){const wheel=mesh(new THREE.TorusGeometry(.65,.09,8,32),0xa7824f,g.x+1,1,g.z-1);box(.2,.9,.2,0x846344,g.x+1,.45,g.z-1);wheel.userData.wheel=true;colliders.push({x:g.x+1,z:g.z-1,r:.8})}
      if(i===4){box(1.1,.7,.7,0xa4bba0,g.x+1,.45,g.z-1);box(.4,.1,.1,0xfff2d7,g.x+1,.85,g.z-1);box(.1,.1,.4,0xfff2d7,g.x+1,.85,g.z-1)}
    });
    // Ground cover uses deterministic positions, shared geometry and one instanced draw.
    const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.09,0),new THREE.MeshStandardMaterial({color:0xf0d599}),120),dummy=new THREE.Object3D();for(let i=0;i<120;i++){const a=i*2.399,r=11+Math.sin(i*3.7)*1.5;dummy.position.set(Math.cos(a)*r,.16,Math.sin(a)*r);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix)}scene.add(flowers);
    avatar=guide(player.x,player.z,0xe4c79e);resize=()=>{const w=overlay.clientWidth,h=overlay.clientHeight;if(!w||!h)return;draw.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};window.addEventListener('resize',resize);resize();draw.shadowMap.needsUpdate=true;
  }
  function canWalk(x,z){if(Math.hypot(x,z)>13)return false;return !colliders.some(c=>{if(c.x===3&&c.z===7&&x>=.8&&x<=5.2&&z>=6.55&&z<=7.45)return false;return Math.hypot(x-c.x,z-c.z)<c.r+.22})}
  function tick(now){if(overlay.hidden)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-clock)/1000,.04);clock=now;
    if(mode==='walk'&&card.hidden){const f=Number(keys.has('KeyW')||keys.has('ArrowUp')||keys.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('back')),s=Number(keys.has('KeyD')||keys.has('ArrowRight')||keys.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||keys.has('left')),scale=dt*3/Math.max(1,Math.hypot(f,s)),dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*scale,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*scale;if(canWalk(player.x+dx,player.z))player.x+=dx;if(canWalk(player.x,player.z+dz))player.z+=dz;camera.position.set(player.x,1.05,player.z);camera.lookAt(player.x-Math.sin(yaw)*4,1,player.z-Math.cos(yaw)*4)}
    else if(mode==='map'){camera.position.lerp(targetCamera,1-Math.exp(-5*dt));look.lerp(targetLook,1-Math.exp(-5*dt));camera.lookAt(look)}
    avatar.visible=mode==='map';avatar.position.set(player.x,0,player.z);decorations.forEach((g,i)=>g.rotation.y=Math.sin(now*.0005+i)*.12);draw.render(scene,camera);
  }
  function open(){if(!overlay.hidden)return;lastFocus=document.activeElement;window.TownApp?.stopFirstPerson();document.exitPointerLock?.();keys.clear();overlay.hidden=false;document.body.dataset.forestOpen='true';mode='map';targetCamera.set(20,25,29);targetLook.set(0,0,-1);try{makeScene();refresh();overlay.focus();clock=performance.now();frame=requestAnimationFrame(tick)}catch{notify(tr('error'))}}
  function exit(){if(overlay.hidden)return;overlay.hidden=true;delete document.body.dataset.forestOpen;cancelAnimationFrame(frame);keys.clear();closeCard();if(resize)window.removeEventListener('resize',resize);if(scene){const geometry=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.shadow?.map)o.shadow.map.dispose()});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}draw?.renderLists.dispose();scene=null;treeCrown=null;markers.length=colliders.length=decorations.length=0;lastFocus?.focus({preventScroll:true})}
  function interact(){let i=-1,dist=3.5;glades.forEach((g,index)=>{const d=Math.hypot(player.x-g.x,player.z-g.z);if(d<dist){i=index;dist=d}});if(i>=0)select(i);else notify(tr('walkHint'))}
  entry.onclick=open;window.addEventListener('town-open-forest',open);
  overlay.querySelector('[data-action="exit"]').onclick=exit;
  overlay.querySelector('[data-action="journal"]').onclick=journal;
  overlay.querySelector('[data-action="view"]').onclick=()=>{closeCard();mode=mode==='map'?'walk':'map';if(mode==='map'){targetCamera.set(20,25,29);targetLook.set(0,0,-1)}refresh()};
  overlay.querySelector('[data-action="interact"]').onclick=interact;
  overlay.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move)});
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x;drag.moved ||= Math.abs(dx)+Math.abs(e.clientY-drag.y)>3;if(mode==='walk'&&card.hidden)yaw-=dx*.006;drag.x=e.clientX;drag.y=e.clientY};
  canvas.onpointerup=e=>{if(drag&&!drag.moved&&mode==='map'&&card.hidden){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=raycaster.intersectObjects(markers)[0];if(hit)select(hit.object.userData.station)}drag=null};canvas.onpointercancel=()=>drag=null;
  window.addEventListener('keydown',e=>{if(overlay.hidden)return;e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();if(!card.hidden)closeCard();else exit();return}if(e.code==='Tab'){const focusable=[...overlay.querySelectorAll('button:not(:disabled),summary')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===overlay)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}return}if(!card.hidden)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE'].includes(e.code)){e.preventDefault();if(mode==='walk'){keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)interact()}else if(e.code.startsWith('Arrow')){active=(active+(e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1)+glades.length)%glades.length;refresh();overlay.querySelectorAll('nav button')[active].focus()}}},true);
  window.addEventListener('keyup',e=>{if(overlay.hidden)return;keys.delete(e.code);e.stopImmediatePropagation()},true);window.addEventListener('blur',()=>keys.clear());
  let shownLanguage=language();const observer=new MutationObserver(()=>{if(shownLanguage===language())return;shownLanguage=language();refresh();if(!overlay.hidden&&view==='quiz'&&question)showQuestion(question);else if(!overlay.hidden&&view==='journal')journal()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
