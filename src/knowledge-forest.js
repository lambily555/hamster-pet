import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
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
  guide:['森林向导','Forest guide','Guía del bosque'],
  welcomeMap:['先点击箭头下的向导鼠，听完介绍再开始探索','Click the guide beneath the arrow before exploring','Pulsa el guía bajo la flecha antes de explorar'],
  welcome:['先沿箭头找到向导鼠 · WASD / 方向键行走 · 靠近后按 E','Follow the arrows to the guide · WASD / arrows to walk · E to talk','Sigue las flechas hasta el guía · WASD / flechas para caminar · E para hablar'],
  introduction:['欢迎来到知识森林！先认个路：五处营地各有三道小问题，答对会收下一片知识叶。答错也别慌，听完解释还能再试。想复习就来找我，我把你学过的知识都记着。','Welcome to the forest! Each of the five camps has three questions. Correct answers earn knowledge leaves. Miss one? Read the explanation and try again. Come back to me whenever you want to review what you have learned.','¡Bienvenido al bosque! Cada uno de los cinco campamentos tiene tres preguntas. Las respuestas correctas dan hojas de conocimiento. Si fallas, lee la explicación e inténtalo de nuevo. Vuelve a verme cuando quieras repasar lo aprendido.'],
  begin:['明白啦，开始探索','Got it. Let’s explore','Entendido. A explorar'],
  leaves:['知识叶片','Knowledge leaves','Hojas de conocimiento'],
  hint:['左键拖动旋转 · 右键拖动平移 · 滚轮缩放 · 点击营地答题','Drag to orbit · Right-drag to pan · Scroll to zoom · Click a camp','Arrastra para girar · Botón derecho para desplazar · Rueda para acercar · Pulsa un campamento'],
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

export function createKnowledgeForestLandscape(compact=false){
  const scene=new THREE.Group(),colliders=[],markers=[],decorations=[];let treeCrown;
  function mesh(geometry,color,x,y,z,parent=scene){
    const kind=[0x79583d,0x826345].includes(color)?'bark':[0x98794e,0xc9ab77,0xa08355,0x926a43,0xa88253,0xa7824f,0x846344].includes(color)?'wood':color===0x8b9c69?'grass':color===0x8b7252?'soil':[0xd9c49b,0xc6ba8d].includes(color)?'gravel':[0x587e4c,0x6f9053,0x486e4c,0x89a95e,0xaac37a,0x729852].includes(color)?'foliage':null;
    const material=kind?worldMaterial(kind,color):new THREE.MeshStandardMaterial({color,roughness:.9}),m=new THREE.Mesh(geometry,material);if(kind){applyWorldSurface(m,kind);if(m.geometry!==geometry)geometry.dispose()}m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,color,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent)}
  function sphere(r,color,x,y,z,parent){return mesh(new THREE.IcosahedronGeometry(r,1),color,x,y,z,parent)}
  function guide(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);sphere(.42,color,0,.5,0,g).scale.set(.85,1,.72);sphere(.32,color,0,.94,0,g);[-1,1].forEach(s=>{sphere(.16,color,s*.23,1.17,0,g);sphere(.105,0xe9b3a3,s*.23,1.17,.1,g);sphere(.047,0x332820,s*.12,1,.26,g);sphere(.1,color,s*.19,.13,.1,g)});sphere(.045,0xb67161,0,.91,.31,g);return g}
  function tree(x,z,size=1,color=0x587e4c){box(.38*size,2*size,.38*size,0x79583d,x,size,z);sphere(1.35*size,color,x,2.4*size,z);sphere(.95*size,color,x-.5*size,3.2*size,z);colliders.push({x,z,r:.5*size})}
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
  const navigator=guide(0,8,0xe4c79e);navigator.userData.forestGuide=true;colliders.push({x:0,z:8,r:.65});
  const avatar=guide(0,10,0xe4c79e);
  if(compact){
    scene.updateMatrixWorld(true);const batches=new Map(),oldGeometry=new Set(),oldMaterials=new Set(),keep=[];
    scene.traverse(o=>{if(o.isInstancedMesh){keep.push(o);return}if(!o.isMesh)return;const m=o.material,id=[m.color.getHex(),m.map?.uuid,m.normalMap?.uuid,m.roughness].join(':');if(!batches.has(id))batches.set(id,{material:m,parts:[]});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);batches.get(id).parts.push(g);oldGeometry.add(o.geometry);oldMaterials.add(m)});
    scene.clear();for(const {material,parts} of batches.values()){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,material);mesh.receiveShadow=true;scene.add(mesh);oldMaterials.delete(material)}keep.forEach(o=>scene.add(o));oldGeometry.forEach(g=>g.dispose());oldMaterials.forEach(m=>m.dispose());
  }
  return {root:scene,colliders,markers,decorations,treeCrown,avatar,navigator,createVisitor:(x,z,color)=>guide(x,z,color)};
}

export function installKnowledgeForest(){
  if(document.getElementById('knowledgeForest'))return;
  const overlay=document.createElement('section');overlay.id='knowledgeForest';overlay.setAttribute('data-i18n-user','');overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',tr('title'));overlay.tabIndex=-1;
  overlay.innerHTML='<canvas class="forest-canvas"></canvas><div class="forest-header"><div><small>FOREST FIELD NOTES / 01</small><h1></h1><p></p></div><button data-action="exit"></button></div><div class="forest-tools"><span class="forest-progress"></span><button data-action="view"></button></div><nav class="forest-stations"></nav><div class="forest-caption"></div><div class="forest-touch"><button data-move="forward">↑</button><button data-move="left">←</button><button data-move="back">↓</button><button data-move="right">→</button><button data-action="interact">E</button></div><section class="forest-card" hidden></section><div class="forest-toast" role="status"></div>';
  document.body.appendChild(overlay);
  const canvas=overlay.querySelector('canvas'),card=overlay.querySelector('.forest-card'),toast=overlay.querySelector('.forest-toast');
  let progress=cleanProgress(null);try{progress=cleanProgress(JSON.parse(localStorage.getItem(key)||'null'))}catch{}
  let draw=null,scene=null,camera=null,frame=0,resize=null,clock=0,mode='map',yaw=0,drag=null,active=-1,question=null,answered=false,view='map',lastFocus=null,toastTimer=0;
  const keys=new Set(),player=new THREE.Vector3(0,.1,10),colliders=[],markers=[],decorations=[],look=new THREE.Vector3(),raycaster=new THREE.Raycaster();
  const targetCamera=new THREE.Vector3(20,25,29),targetLook=new THREE.Vector3(0,0,-1);
  let avatar=null,treeCrown=null,navigator=null,roster=[],rosterKey='',ownerId='main',welcomed=false,guideArrow=null,createVisitor=null,allResidents=[],mainResident=null;
  const visitorRigs=new Map();
  const nameLabels=[];
  function residentName(n){return n?window.TownI18n?.t(n.name)||n.name:''}
  function guideName(i){return residentName(roster[i+1])}
  function readWelcome(){try{return JSON.parse(localStorage.getItem('shushu.knowledge-forest.welcome.v1')||'{}')[ownerId]===true}catch{return false}}
  function syncResidents(state){const people=[...(state.npcs||[]),...(state.offspring||[]),...(state.npcOffspring||[])].filter(n=>n.id&&n.name&&n.alive!==false),seen=new Set();const selected=people.filter(n=>!seen.has(n.id)&&seen.add(n.id)).slice(0,6),signature=JSON.stringify([people.map(n=>[n.id,n.name,n.coat]),state.mainId,state.mainName,state.mainCoat]);ownerId=state.mainId||'main';allResidents=people;mainResident={id:ownerId,name:state.mainName||'鼠鼠',coat:state.mainCoat};if(signature===rosterKey)return;rosterKey=signature;roster=selected;if(scene){paintResidents();refresh();if(view==='welcome')showGuide()}}
  function paintResidents(){
    for(const label of nameLabels){label.parent?.remove(label);label.material.map?.dispose();label.material.dispose()}nameLabels.length=0;
    [navigator,...decorations,...visitorRigs.values(),avatar].forEach((rig,i)=>{const n=i<6?roster[i]:rig===avatar?mainResident:allResidents.find(n=>n.id===rig.userData.residentId);if(!rig)return;rig.visible=!!n;if(!n)return;rig.userData.residentId=n.id;if(i<6)rig.userData.station=i-1;rig.traverse(o=>{if(o.isMesh&&o.material?.color&&o.material.color.getHex()!==0x332820&&o.material.color.getHex()!==0xe9b3a3&&o.material.color.getHex()!==0xb67161)o.material.color.setHex(({silver:0xeeeae0,pudding:0xead49b,violet:0xb5adc2,'three-line':0x665e55})[n.coat]||0x938574)});const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#fff9e9ee';ctx.beginPath();ctx.roundRect(0,0,512,96,24);ctx.fill();ctx.fillStyle='#344832';ctx.font='600 56px sans-serif';ctx.textAlign='center';ctx.fillText(residentName(n)+(i===0?' · '+tr('guide'):''),256,59,490);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:true}));label.scale.set(i===0?3.2:2.2,.5,1);label.position.y=1.52;rig.add(label);nameLabels.push(label)});
  }
  function notify(text){toast.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.textContent='',4500)}
  function save(){try{localStorage.setItem(key,JSON.stringify(progress))}catch{notify(tr('storage'))}}
  function button(label,fn,className=''){const el=document.createElement('button');el.type='button';el.textContent=label;el.className=className;el.onclick=fn;return el}
  function count(g){return questions.filter(q=>q.glade===g.id&&progress.learned.includes(q.id)).length}
  function refresh(){
    if(overlay.hidden)return;
    overlay.setAttribute('aria-label',tr('title'));overlay.querySelector('.forest-header small').textContent=tr('field');overlay.querySelector('h1').textContent=tr('title');overlay.querySelector('.forest-header p').textContent=tr('subtitle');
    overlay.querySelector('[data-action="exit"]').textContent='← '+tr('back');overlay.querySelector('[data-action="view"]').textContent=tr(mode==='map'?'walk':'map');
    overlay.querySelector('.forest-progress').textContent=`✦ ${progress.learned.length} / ${questions.length} · ${tr('leaves')}`;
    overlay.querySelector('.forest-caption').textContent=!welcomed?tr(mode==='walk'?'welcome':'welcomeMap'):progress.learned.length===questions.length?tr('complete'):tr(mode==='map'?'hint':'walkHint');
    overlay.querySelector('.forest-touch').hidden=mode!=='walk';const nav=overlay.querySelector('nav');nav.replaceChildren();
    glades.forEach((g,i)=>{const b=button(`${String(i+1).padStart(2,'0')}  ${localized(g.name)}  ${count(g)}/3`,()=>select(i));b.disabled=!welcomed;b.classList.toggle('learned',count(g)===3);b.classList.toggle('active',active===i);nav.appendChild(b)});
    if(treeCrown){treeCrown.material.emissive.setHex(progress.learned.length===questions.length?0xffcd63:0x234f31);treeCrown.material.emissiveIntensity=progress.learned.length===questions.length?.45:.08}
  }
  function panel(title){card.replaceChildren();card.hidden=false;const header=document.createElement('div'),h=document.createElement('h2');header.className='forest-card-head';h.textContent=title;header.append(h,button('×',closeCard));header.lastChild.setAttribute('aria-label',tr('close'));card.append(header);keys.clear();return card}
  function paragraph(text,className=''){const p=document.createElement('p');p.textContent=text;p.className=className;card.appendChild(p);return p}
  function closeCard(){card.hidden=true;view='map';question=null;keys.clear();overlay.focus({preventScroll:true})}
  function select(i){
    if(!welcomed){notify(tr(mode==='walk'?'welcome':'welcomeMap'));return}active=i;refresh();const g=glades[i];
    if(mode==='walk'&&Math.hypot(player.x-g.x,player.z-g.z)>3.5){notify(localized(g.name)+' · '+tr('walkHint'));return}
    if(mode==='map'){targetLook.set(g.x,.5,g.z);targetCamera.set(g.x+7,10,g.z+11)}
    const available=questions.filter(q=>q.glade===g.id);showQuestion(available.find(q=>!progress.learned.includes(q.id))||available[0]);
  }
  function showQuestion(q){
    question=q;view='quiz';answered=false;const g=glades.find(g=>g.id===q.glade),group=questions.filter(item=>item.glade===g.id);
    panel((guideName(glades.indexOf(g))?guideName(glades.indexOf(g))+' · ':'')+localized(g.name));paragraph(`${group.indexOf(q)+1} / ${group.length}`,'forest-eyebrow');paragraph(localized(q.q),'forest-question');
    const options=document.createElement('div');options.className='forest-options';q.answers.forEach((answer,i)=>options.appendChild(button(`${String.fromCharCode(65+i)}  ${localized(answer)}`,()=>answerQuestion(i))));card.append(options);card.querySelector('.forest-options button').focus({preventScroll:true});
  }
  function answerQuestion(choice){
    if(answered||!question)return;answered=true;const q=question,correct=recordAnswer(progress,q.id,choice);if(correct)save();refresh();
    const buttons=[...card.querySelectorAll('.forest-options button')];buttons.forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',i===q.correct);b.classList.toggle('incorrect',i===choice&&!correct)});
    const feedback=paragraph(tr(correct?'correct':'incorrect'),'forest-feedback');feedback.setAttribute('role','status');paragraph(localized(q.explanation));paragraph(`${tr('source')}: ${sources[q.source][0]}`,'forest-source');
    const list=questions.filter(item=>item.glade===q.glade),index=list.indexOf(q);
    const next=button(tr(correct?'next':'retry'),()=>{if(!correct){showQuestion(q);return}if(index<list.length-1){showQuestion(list[index+1]);return}closeCard();notify(tr('done'));if(mode==='map'){targetCamera.set(20,25,29);targetLook.set(0,0,-1)}},'forest-primary');card.append(next);next.focus({preventScroll:true});
  }
  function showGuide(){clearTimeout(toastTimer);toast.textContent='';if(mode==='map'){targetLook.set(0,.7,8);targetCamera.set(5,6,15)}view=welcomed?'guide':'welcome';panel((residentName(roster[0])?residentName(roster[0])+' · ':'')+tr('guide'));paragraph(tr('introduction'));if(!welcomed){card.append(button(tr('begin'),()=>{let visits={};try{visits=JSON.parse(localStorage.getItem('shushu.knowledge-forest.welcome.v1')||'{}')||{}}catch{}welcomed=true;try{visits[ownerId]=true;localStorage.setItem('shushu.knowledge-forest.welcome.v1',JSON.stringify(visits))}catch{notify(tr('storage'))}guideArrow.visible=false;closeCard();refresh()},'forest-primary'));return}paragraph(tr('note'));if(!progress.learned.length)paragraph(tr('empty'));
    for(const q of questions.filter(q=>progress.learned.includes(q.id))){const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('p');summary.textContent=localized(q.q);body.textContent=localized(q.explanation);details.append(summary,body);card.append(details)}
    paragraph(tr('source'),'forest-eyebrow');sources.forEach(([name,url])=>{const p=paragraph(name+': '+url,'forest-source');p.style.overflowWrap='anywhere'});
  }
  function makeScene(){
    if(!draw)draw=new THREE.WebGLRenderer({canvas,antialias:true});draw.setPixelRatio(Math.min(devicePixelRatio,1.5));draw.toneMapping=THREE.ACESFilmicToneMapping;draw.shadowMap.enabled=true;draw.shadowMap.type=THREE.PCFSoftShadowMap;draw.shadowMap.autoUpdate=false;
    scene=new THREE.Scene();scene.background=new THREE.Color(0xdbe7cd);scene.fog=new THREE.Fog(0xdbe7cd,32,65);camera=new THREE.PerspectiveCamera(43,1,.1,90);camera.position.copy(targetCamera);look.copy(targetLook);
    scene.add(new THREE.HemisphereLight(0xfff5de,0x738768,2.4));const sun=new THREE.DirectionalLight(0xffe6b1,3.2);sun.position.set(-10,25,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21});sun.shadow.normalBias=.04;scene.add(sun);
    const forest=createKnowledgeForestLandscape();scene.add(forest.root);colliders.push(...forest.colliders);markers.push(...forest.markers);decorations.push(...forest.decorations);treeCrown=forest.treeCrown;avatar=forest.avatar;navigator=forest.navigator;createVisitor=forest.createVisitor;markers.push(navigator,...decorations);guideArrow=new THREE.Mesh(new THREE.ConeGeometry(.25,.65,4),new THREE.MeshStandardMaterial({color:0xe5b545,emissive:0x8a650a,emissiveIntensity:.3}));guideArrow.rotation.z=Math.PI;guideArrow.position.set(0,2.7,8);scene.add(guideArrow);guideArrow.visible=!welcomed;for(const z of [11,10,9]){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,3),guideArrow.material);arrow.rotation.x=-Math.PI/2;arrow.position.set(0,.08,z);scene.add(arrow)}paintResidents();
    resize=()=>{const w=overlay.clientWidth,h=overlay.clientHeight;if(!w||!h)return;draw.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};window.addEventListener('resize',resize);resize();draw.shadowMap.needsUpdate=true;
  }
  function canWalk(x,z){if(Math.hypot(x,z)>13)return false;return ![...visitorRigs.values()].some(r=>r.visible&&Math.hypot(x-r.position.x,z-r.position.z)<.55)&&!colliders.some(c=>{if(c.x===3&&c.z===7&&x>=.8&&x<=5.2&&z>=6.55&&z<=7.45)return false;return Math.hypot(x-c.x,z-c.z)<c.r+.22})}
  function tick(now){if(overlay.hidden)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-clock)/1000,.04);clock=now;
    const visitors=window.TownApp?.tickForest?.(dt)||[],present=new Set();let added=false;for(const v of visitors){if(roster.some(n=>n.id===v.id))continue;const n=allResidents.find(n=>n.id===v.id);if(!n)continue;present.add(v.id);let rig=visitorRigs.get(v.id);if(!rig){rig=createVisitor(v.x,v.z,0xc6b195);rig.userData.residentId=v.id;visitorRigs.set(v.id,rig);added=true}rig.visible=true;rig.position.set(v.x,v.moving?Math.abs(Math.sin(now*.006))*.025:0,v.z);rig.rotation.y=v.heading}for(const [id,rig] of visitorRigs)if(!present.has(id))rig.visible=false;if(added)paintResidents();
    if(mode==='walk'&&card.hidden){const f=Number(keys.has('KeyW')||keys.has('ArrowUp')||keys.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('back')),s=Number(keys.has('KeyD')||keys.has('ArrowRight')||keys.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||keys.has('left')),scale=dt*3/Math.max(1,Math.hypot(f,s)),dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*scale,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*scale;if(canWalk(player.x+dx,player.z))player.x+=dx;if(canWalk(player.x,player.z+dz))player.z+=dz;camera.position.set(player.x,1.05,player.z);camera.lookAt(player.x-Math.sin(yaw)*4,1,player.z-Math.cos(yaw)*4)}
    else if(mode==='map'){camera.position.lerp(targetCamera,1-Math.exp(-5*dt));look.lerp(targetLook,1-Math.exp(-5*dt));camera.lookAt(look)}
    for(const label of nameLabels){const point=label.getWorldPosition(new THREE.Vector3()),height=Math.min(.45,point.distanceTo(camera.position)*2*Math.tan(43*Math.PI/360)*36/Math.max(1,canvas.clientHeight));label.scale.set(height*512/96,height,1)}if(guideArrow?.visible)guideArrow.position.y=2.7+Math.sin(now*.004)*.15;avatar.visible=mode==='map';avatar.position.set(player.x,0,player.z);decorations.forEach((g,i)=>g.rotation.y=Math.sin(now*.0005+i)*.12);draw.render(scene,camera);
  }
  function open(event){if(!overlay.hidden)return;lastFocus=document.activeElement;window.TownApp?.stopFirstPerson();window.TownApp?.clearFocus?.(false);document.exitPointerLock?.();keys.clear();overlay.hidden=false;document.body.dataset.forestOpen='true';welcomed=readWelcome();mode=event?.detail?.view==='walk'?'walk':'map';if(!welcomed){player.set(0,.1,12);yaw=0}targetCamera.set(20,25,29);targetLook.set(0,0,-1);try{makeScene();refresh();overlay.focus();clock=performance.now();frame=requestAnimationFrame(tick)}catch{notify(tr('error'))}}
  function exit(){if(overlay.hidden)return;drag=null;overlay.hidden=true;delete document.body.dataset.forestOpen;cancelAnimationFrame(frame);keys.clear();closeCard();if(resize)window.removeEventListener('resize',resize);if(scene){const geometry=new Set(),materials=new Set();scene.traverse(o=>{if(o.isSprite&&o.material?.map)o.material.map.dispose();if(o.geometry)geometry.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.shadow?.map)o.shadow.map.dispose()});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}draw?.renderLists.dispose();scene=null;treeCrown=null;visitorRigs.clear();nameLabels.length=0;markers.length=colliders.length=decorations.length=0;lastFocus?.focus({preventScroll:true})}
  function interact(){if(navigator?.visible&&Math.hypot(player.x,player.z-8)<3.5){showGuide();return}if(!welcomed){notify(tr('welcome'));return}let i=-1,dist=3.5;glades.forEach((g,index)=>{const d=Math.hypot(player.x-g.x,player.z-g.z);if(d<dist){i=index;dist=d}});if(i>=0)select(i);else notify(tr('walkHint'))}
  window.addEventListener('town-open-forest',open);
  overlay.querySelector('[data-action="exit"]').onclick=exit;
  overlay.querySelector('[data-action="view"]').onclick=()=>{closeCard();mode=mode==='map'?'walk':'map';if(mode==='map'){targetCamera.set(20,25,29);targetLook.set(0,0,-1)}refresh()};
  overlay.querySelector('[data-action="interact"]').onclick=interact;
  overlay.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.move)});
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{if(!card.hidden)return;e.preventDefault();drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,button:e.button,moved:false};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4;
    if(mode==='walk'&&card.hidden)yaw-=dx*.006;
    else if(mode==='map'&&card.hidden&&drag.moved){const offset=targetCamera.clone().sub(targetLook),spherical=new THREE.Spherical().setFromVector3(offset);
      if(drag.button===2||drag.button===1||e.shiftKey){const scale=2*spherical.radius*Math.tan(43*Math.PI/360)/Math.max(1,canvas.clientHeight),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3().crossVectors(right,camera.up).normalize(),next=targetLook.clone().addScaledVector(right,-dx*scale).addScaledVector(forward,dy*scale);next.x=THREE.MathUtils.clamp(next.x,-16,16);next.z=THREE.MathUtils.clamp(next.z,-16,16);targetCamera.add(next.clone().sub(targetLook));targetLook.copy(next)}
      else if(drag.button===0){spherical.theta-=dx*.006;spherical.phi=THREE.MathUtils.clamp(spherical.phi-dy*.006,.2,1.25);targetCamera.copy(targetLook).add(offset.setFromSpherical(spherical))}
    }drag.x=e.clientX;drag.y=e.clientY};
  canvas.onpointerup=e=>{if(drag&&drag.button===0&&!drag.moved&&mode==='map'&&card.hidden){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=raycaster.intersectObjects(markers,true).find(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return true});if(hit){let node=hit.object;while(node&&!node.userData.forestGuide&&!Number.isInteger(node.userData.station))node=node.parent;if(node?.userData.forestGuide)showGuide();else if(node)select(node.userData.station)}}drag=null};canvas.onpointercancel=canvas.onlostpointercapture=()=>drag=null;
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode!=='map'||!card.hidden)return;const offset=targetCamera.clone().sub(targetLook),step=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1),distance=THREE.MathUtils.clamp(offset.length()*Math.exp(THREE.MathUtils.clamp(step,-1000,1000)*.001),6,48);targetCamera.copy(targetLook).add(offset.setLength(distance))},{passive:false});
  window.addEventListener('keydown',e=>{if(overlay.hidden)return;e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();if(!card.hidden)closeCard();else exit();return}if(e.code==='Tab'){const focusable=[...overlay.querySelectorAll('button:not(:disabled),summary')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===overlay)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}return}if(!card.hidden)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE'].includes(e.code)){e.preventDefault();if(mode==='walk'){keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)interact()}else if(e.code.startsWith('Arrow')){active=(active+(e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1)+glades.length)%glades.length;refresh();overlay.querySelectorAll('nav button')[active].focus()}}},true);
  window.addEventListener('keyup',e=>{if(overlay.hidden)return;keys.delete(e.code);e.stopImmediatePropagation()},true);window.addEventListener('blur',()=>keys.clear());
  let shownLanguage=language();const observer=new MutationObserver(()=>{if(shownLanguage===language())return;shownLanguage=language();refresh();if(!overlay.hidden&&view==='quiz'&&question)showQuestion(question);else if(!overlay.hidden&&['guide','welcome'].includes(view))showGuide();if(!overlay.hidden)paintResidents()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  return {syncResidents};
}
