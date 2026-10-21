import * as THREE from 'three';

// Original, seamless small maps. No game assets or per-frame texture generation.
const profiles={
 grass:{span:2.4,roughness:1,relief:.003,contrast:.22},
 soil:{span:1.4,roughness:1,relief:.006,contrast:.25},
 gravel:{span:.9,roughness:.95,relief:.004,contrast:.24},
 stone:{span:.65,roughness:.84,relief:.004,contrast:.17},
 roof:{span:.8,roughness:.82,relief:.004,contrast:.12},
 bark:{span:.55,roughness:.95,relief:.008,contrast:.2},
 foliage:{span:1,roughness:.93,relief:.002,contrast:.12},
 paint:{span:.7,roughness:null,relief:.0008,contrast:.035},
 metal:{span:.45,roughness:null,relief:.0003,contrast:.025},
 fabric:{span:.35,roughness:.95,relief:.002,contrast:.09}
};
const textures=new Map(),materials=new WeakMap();
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+57.3)*43758.5453;return n-Math.floor(n)};
function noise(x,y,period,periodY=period){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash(ix%period,iy%periodY),b=hash((ix+1)%period,iy%periodY),c=hash(ix%period,(iy+1)%periodY),d=hash((ix+1)%period,(iy+1)%periodY);
 return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}
function maps(kind){
 if(textures.has(kind))return textures.get(kind);
 const size=256,color=new Uint8Array(size*size*4),height=new Uint8Array(color.length),p=profiles[kind];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const broad=noise(x/32,y/32,8),grain=hash(x,y),fine=noise(x/4,y/4,64);
  let value=.48*broad+.32*fine+.2*grain;
  if(kind==='grass')value=.55*broad+.2*fine+.25*noise(x/2,y/8,128,32);
  if(kind==='gravel'||kind==='stone')value=.45*fine+.35*grain+.2*broad;
  if(kind==='bark')value=.7*noise(x/4,y/64,64,4)+.3*grain;
  if(kind==='fabric')value=.55+(x%4<2?.17:-.17)+(y%4<2?.12:-.12);
  if(kind==='metal')value=.65*hash(0,y)+.35*grain;
  const shade=Math.round(255*(1-p.contrast*(1-value))),i=(y*size+x)*4;
  color[i]=shade;color[i+1]=shade;color[i+2]=shade;color[i+3]=255;
  height[i]=height[i+1]=height[i+2]=Math.round(value*255);height[i+3]=255;
 }
 const make=(data,colorSpace)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.colorSpace=colorSpace;t.needsUpdate=true;return t};
 const result={map:make(color,THREE.SRGBColorSpace),bumpMap:make(height,THREE.NoColorSpace)};textures.set(kind,result);return result;
}
function detail(material,kind){
 const p=profiles[kind],t=maps(kind);material.map=t.map;material.bumpMap=t.bumpMap;material.bumpScale=p.relief;
 if(p.roughness!==null)material.roughness=p.roughness;
 material.userData.townSurface=kind;material.userData.worldSurface=kind;
 return material;
}
export function worldMaterial(kind,color,extra={}){
 return detail(new THREE.MeshStandardMaterial({color,roughness:.8,...extra}),kind);
}
function project(mesh,kind,units){
 if(mesh.userData.worldSurfaceUV||mesh.isInstancedMesh)return;
 // Curved ornaments keep their authored UVs; planar surfaces use real dimensions.
 if(!['BoxGeometry','CylinderGeometry','PlaneGeometry'].includes(mesh.geometry.type))return;
 const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal;if(!p||!n)return;
 const uv=new Float32Array(p.count*2),span=profiles[kind].span;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)*mesh.scale.x*units,y=p.getY(i)*mesh.scale.y*units,z=p.getZ(i)*mesh.scale.z*units;
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  uv[i*2]=(ny>=nx&&ny>=nz?x:nx>=nz?z:x)/span;uv[i*2+1]=(ny>=nx&&ny>=nz?z:y)/span;
 }
 // A geometry may be reused by furniture instances. Keep their UVs independent.
 mesh.geometry=g.clone();mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));mesh.userData.worldSurfaceUV=true;
}
export function applyWorldSurface(mesh,kind,units=1){
 const original=mesh.material;
 if(!mesh.isMesh||Array.isArray(original)||!original.isMeshStandardMaterial||original.transparent||original.emissive?.getHex()||original.userData.hamsterFur)return mesh;
 if(!mesh.geometry.attributes.uv)return mesh;
 if(original.userData.worldSurface){project(mesh,original.userData.worldSurface,units);return mesh}
 if(original.map||original.userData.townSurface||original.roughness<.2)return mesh;
 let byKind=materials.get(original);if(!byKind){byKind=new Map();materials.set(original,byKind)}
 if(!byKind.has(kind))byKind.set(kind,detail(original.clone(),kind));
 mesh.material=byKind.get(kind);project(mesh,kind,units);return mesh;
}
export function finishWorldSurfaces(group,units=1){
 group.traverse(mesh=>{
  if(!mesh.isMesh||Array.isArray(mesh.material))return;
  const p=mesh.geometry.parameters;
  if(!mesh.material.userData.worldSurface&&p&&Math.max((p.width||p.radius*2||0)*mesh.scale.x,(p.height||p.radius*2||0)*mesh.scale.y,(p.depth||p.radius*2||0)*mesh.scale.z)*units<.12)return;
  const kind=mesh.material.userData.worldSurface||(mesh.userData.cutawayRoof||mesh.userData.petRoof?'roof':mesh.material.metalness>.1?'metal':'paint');
  applyWorldSurface(mesh,kind,units);
 });
}
