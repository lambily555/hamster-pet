import * as THREE from 'three';

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
 '鼠鼠小屋':{floor:'wood',tint:0xffedcf,roughness:.68},
 '鼠鼠学校':{floor:'wood',tint:0xf7efd9,roughness:.75},
 '宠物之家':{floor:'wood',tint:0xffefd8,roughness:.7},
 '零食铺':{floor:'wood',tint:0xffefd3,roughness:.65},
 '鼠鼠饭馆':{floor:'tile',tint:0xfff3df,roughness:.48},
 'Mariah Carey名人堂':{floor:'marble',tint:0xffffff,roughness:.24},
 '诊所':{floor:'ceramic',tint:0xf1f8f7,roughness:.3},
 '纪念馆':{floor:'marble',tint:0xf5ecd9,roughness:.65},
 '殡仪馆':{floor:'marble',tint:0xe6e8e3,roughness:.72}
};
function ceramicTexture(){
 if(maps.has('ceramic'))return maps.get('ceramic');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#f4f7f5';ctx.fillRect(0,0,256,256);
 ctx.strokeStyle='#d5dedb';ctx.lineWidth=2;ctx.strokeRect(0,0,256,256);
 const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;maps.set('ceramic',map);return map;
}
export function applyBuildingSurface(mesh,name,role='floor',units=1){
 const style=buildingSurfaceStyles[name];if(!style||!mesh.isMesh)return mesh;
 const kind=role==='wood'?'wood':role==='stone'?'marble':style.floor;
 const material=mesh.material.clone();material.color.set(role==='wood'?0xffefd9:style.tint);
 material.roughness=role==='wood'?.7:style.roughness;material.metalness=0;
 material.map=kind==='ceramic'?ceramicTexture():texture(kind,'Color');
 if(kind!=='ceramic'){material.normalMap=texture(kind,'NormalGL');material.normalScale=new THREE.Vector2(kind==='wood'?.18:.1,kind==='wood'?.18:.1);material.roughnessMap=texture(kind,'Roughness')}
 material.envMapIntensity=kind==='wood'?.25:.65;material.userData.townSurface=kind;
 mesh.material=material;
 const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=new Float32Array(p.count*2),span=kind==='wood'?1.8:kind==='tile'?2.1:kind==='ceramic'?.45:2.4;
 for(let i=0;i<p.count;i++){
  const x=(p.getX(i)*mesh.scale.x+mesh.position.x)*units,y=(p.getY(i)*mesh.scale.y+mesh.position.y)*units,z=(p.getZ(i)*mesh.scale.z+mesh.position.z)*units;
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  uv[i*2]=(ny>=nx&&ny>=nz?x:nx>=nz?z:x)/span;uv[i*2+1]=(ny>=nx&&ny>=nz?z:y)/span;
 }
 mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return mesh;
}
const woodColors=new Set([0x95603b,0x987954,0x826c51,0x886846,0x98744f,0xb58d62,0x94704e,0x99603a,0x68452e,0x805132,0xc99553,0x9d886f]);
export function finishBuildingSurfaces(group,name,units=1){
 if(!buildingSurfaceStyles[name])return;
 group.traverse(mesh=>{
  if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.map||mesh.material.transparent||mesh.material.metalness>.1)return;
  if(woodColors.has(mesh.material.color.getHex()))applyBuildingSurface(mesh,name,'wood',units);
  else if(name==='Mariah Carey名人堂'&&[0xeae4d6,0xe8e3d7,0xe8ddc9,0xf1e8d6].includes(mesh.material.color.getHex()))applyBuildingSurface(mesh,name,'stone',units);
  else if(mesh.geometry.type==='BoxGeometry'){
   const {width,height,depth}=mesh.geometry.parameters;
   if(width*units>2&&depth*units>1&&height*units<.5&&mesh.position.y*units<.4)applyBuildingSurface(mesh,name,'floor',units);
  }
 });
}
