import * as THREE from 'three';
import {finishWorldSurfaces} from './town-world-surfaces.js';

// Small local CC0 maps, shared by all buildings; never fetched at runtime.
const maps=new Map(),loader=new THREE.TextureLoader();
function texture(kind,channel){
 const key=kind+'-'+channel;if(maps.has(key))return maps.get(key);
 const map=loader.load('../assets/town-materials/'+key+'.jpg');
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
 if(channel==='Color')map.colorSpace=THREE.SRGBColorSpace;
 maps.set(key,map);return map;
}
export const buildingSurfaceStyles={
 '鼠鼠小屋':{floor:'wood',tint:0xffedcf,roughness:.68,wall:'plaster',wallTint:0xf2dfc4},
 '鼠鼠学校':{floor:'linoleum',tint:0xcbd9c6,roughness:.8,wall:'wainscot',wallTint:0xfff4dc},
 '宠物之家':{floor:'terrazzo',tint:0xfff0dd,roughness:.65,wall:'paint',wallTint:0xf3d9bd},
 '零食铺':{floor:'ceramic',tint:0xffffff,roughness:.28,wall:'subway',wallTint:0xd9ede3},
 '鼠鼠饭馆':{floor:'terracotta',tint:0xe8b393,roughness:.82,wall:'brick',wallTint:0xf1e2c9},
 'Mariah Carey名人堂':{floor:'ceramic',tint:0xffffff,roughness:.22,wall:'fluted',wallTint:0xf6f4f1},
 '诊所':{floor:'ceramic',tint:0xf2f8f7,roughness:.32,wall:'subway',wallTint:0xe3f1ee},
 '纪念馆':{floor:'limestone',tint:0xe3d7bd,roughness:.8,wall:'plaster',wallTint:0xf0e5cf},
 '殡仪馆':{floor:'slate',tint:0xb1b9b8,roughness:.85,wall:'paint',wallTint:0xe5e9e5}
};
function surfaceTexture(kind){
 if(maps.has(kind))return maps.get(kind);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle=kind==='wainscot'?'#eee4d4':'#f6f5f1';ctx.fillRect(0,0,256,256);
 const noise=i=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n)};
 if(['plaster','paint','linoleum','limestone','slate','terrazzo'].includes(kind)){
  for(let i=0;i<1800;i++){const value=Math.floor(185+noise(i)*60);ctx.fillStyle='rgba('+value+','+value+','+value+','+(kind==='paint'?.22:.48)+')';const size=kind==='terrazzo'?2+noise(i+9)*5:kind==='plaster'?1+noise(i+9)*2:1;ctx.fillRect(noise(i+1)*256,noise(i+2)*256,size,size)}
 }
 if(kind==='terrazzo')for(let i=0;i<260;i++){ctx.fillStyle=['#c3b3a2','#bcc5bc','#d4bdb3','#ddd4c2'][i%4];ctx.fillRect(noise(i+5)*256,noise(i+6)*256,2+noise(i+7)*4,2+noise(i+8)*3)}
 if(kind==='slate')for(let i=0;i<35;i++){ctx.strokeStyle=i%2?'#dedfda':'#eceee9';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,i*7.4);ctx.lineTo(256,i*7.4+noise(i)*4);ctx.stroke()}
 ctx.strokeStyle='#d9d9d2';ctx.lineWidth=1;
 if(['ceramic','terracotta','slate','limestone'].includes(kind)){ctx.strokeStyle=kind==='terracotta'?'#9c8774':'#9eaaa5';ctx.lineWidth=kind==='terracotta'?6:5;ctx.strokeRect(0,0,256,256)}
 if(['subway','brick'].includes(kind))for(let row=0;row<4;row++){const y=row*64;ctx.fillStyle=row%2?'#eeeee8':'#f8f8f4';ctx.fillRect(0,y,256,64);ctx.strokeStyle=kind==='brick'?'#a99b86':'#99ada3';ctx.lineWidth=kind==='brick'?5:4;for(let x=row%2?-128:0;x<256;x+=128)ctx.strokeRect(x,y,128,64)}
 if(kind==='wainscot'){ctx.fillStyle='#bda88a';ctx.fillRect(0,154,256,102);ctx.strokeStyle='#897455';ctx.lineWidth=3;for(let x=0;x<256;x+=32){ctx.beginPath();ctx.moveTo(x,154);ctx.lineTo(x,256);ctx.stroke()}ctx.fillStyle='#d0bc9c';ctx.fillRect(0,151,256,6)}
 if(kind==='fluted')for(let x=0;x<256;x+=16){ctx.fillStyle='#babbb5';ctx.fillRect(x,0,3,256);ctx.fillStyle='#ffffff';ctx.fillRect(x+3,0,2,256)}
 const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;maps.set(kind,map);return map;
}
export function applyBuildingSurface(mesh,name,role='floor',units=1){
 const style=buildingSurfaceStyles[name];if(!style||!mesh.isMesh)return mesh;
 const kind=role==='wood'?'wood':role==='wall'?style.wall:style.floor;
 const material=mesh.material.clone();material.color.set(role==='wood'?0xffefd9:role==='wall'?style.wallTint:style.tint);
 material.roughness=role==='wood'?.7:role==='wall'?(kind==='subway'?.4:.87):style.roughness;material.metalness=0;
 material.map=kind==='wood'?texture(kind,'Color'):surfaceTexture(kind);
 if(kind!=='wood'){const key=kind+'-height';if(!maps.has(key)){const height=material.map.clone();height.colorSpace=THREE.NoColorSpace;height.needsUpdate=true;maps.set(key,height)}material.bumpMap=maps.get(key);material.bumpScale=['ceramic','terracotta','subway','brick','slate','limestone','fluted','wainscot'].includes(kind)?.008:.003}
 if(kind==='wood'){material.normalMap=texture(kind,'NormalGL');material.normalScale=new THREE.Vector2(kind==='wood'?.18:.1,kind==='wood'?.18:.1);material.roughnessMap=texture(kind,'Roughness')}
 material.envMapIntensity=kind==='wood'?.25:.65;material.userData.townSurface=kind;material.userData.townSurfaceRole=role;
 mesh.material=material;
 const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=new Float32Array(p.count*2),span=kind==='wood'?1.8:kind==='ceramic'?.55:kind==='terracotta'?.3:role==='wall'?1.6:1.2;
 for(let i=0;i<p.count;i++){
  const x=(p.getX(i)*mesh.scale.x+mesh.position.x)*units,y=(p.getY(i)*mesh.scale.y+mesh.position.y)*units,z=(p.getZ(i)*mesh.scale.z+mesh.position.z)*units;
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  uv[i*2]=(ny>=nx&&ny>=nz?x:nx>=nz?z:x)/span;uv[i*2+1]=(ny>=nx&&ny>=nz?z:y)/span;
 }
 mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return mesh;
}
const woodColors=new Set([0x95603b,0x987954,0x826c51,0x886846,0x98744f,0xb58d62,0x94704e,0x99603a,0x68452e,0x805132,0xc99553,0x9d886f,0x9b7851,0xb89058,0xa47b49,0x655746,0x6f614c,0x8b7355,0xb69b77]);
export function finishBuildingSurfaces(group,name,units=1){
 if(buildingSurfaceStyles[name])group.traverse(mesh=>{
  if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.map||mesh.material.transparent||mesh.material.metalness>.1)return;
  if(mesh.userData.buildingWall)applyBuildingSurface(mesh,name,'wall',units);
  else if(woodColors.has(mesh.material.color.getHex()))applyBuildingSurface(mesh,name,'wood',units);
  else if(mesh.geometry.type==='BoxGeometry'){
   const {width,height,depth}=mesh.geometry.parameters;
   if(width*units>2&&depth*units>1&&height*units<.5&&mesh.position.y*units<.4)applyBuildingSurface(mesh,name,'floor',units);
  }
 });
 finishWorldSurfaces(group,units);
}
