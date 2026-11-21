import * as THREE from 'three';
import {applyWorldSurface} from './town-world-surfaces.js';

// Original, deterministic forest maps; shared across the world map and close view.
const profiles={grass:[2.4,1,.5],soil:[1.4,1,.75],gravel:[.9,.96,.65],stone:[.65,.86,.55],wood:[.9,.68,.45],bark:[.55,.97,1.1],foliage:[1,.96,.25],roof:[.8,.9,.6],enamel:[.5,.32,.08],metal:[.45,.45,.08],paint:[.7,.8,.1]};
const cache=new Map();
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
function noise(u,v,px=16,py=px){const x=Math.floor(u),y=Math.floor(v),a=u-x,b=v-y,s=a*a*(3-2*a),t=b*b*(3-2*b),h=(dx,dy)=>hash(((x+dx)%px+px)%px,((y+dy)%py+py)%py);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(0,0),h(1,0),s),THREE.MathUtils.lerp(h(0,1),h(1,1),s),t)}
function maps(kind){
 if(cache.has(kind))return cache.get(kind);
 const size=['grass','wood','bark','gravel'].includes(kind)?512:256,pixels=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,broad=noise(u*8,v*8,8),fine=noise(u*64,v*64,64),grain=hash(x,y);let h=.6*broad+.25*fine+.15*grain,r=.87+.13*h,g=r,b=r;
  if(kind==='grass'){const blades=noise(u*128,v*32,128,32),earth=Math.max(0,.34-broad)*.8;h=.45*broad+.35*blades+.2*grain;r=.74+.18*h+earth*.08;g=.85+.15*h-earth*.06;b=.64+.18*h-earth*.08}
  else if(kind==='soil'){h=.38*broad+.35*fine+.27*grain;r=.65+.32*h;g=.59+.33*h;b=.49+.34*h}
  else if(kind==='wood'||kind==='bark'){const warp=Math.sin(v*Math.PI*2)*.7+noise(u*8,v*2,8,2)*1.5,lines=noise(u*64+warp,v*4,64,4),groove=Math.pow(1-lines,5);h=.65*lines+.2*broad+.15*grain;r=(kind==='bark'?.57:.75)+h*.25-groove*.14;g=r-(kind==='bark'?.055:.025);b=r-.08}
  else if(kind==='gravel'||kind==='stone'){const px=u*(kind==='gravel'?64:24),py=v*(kind==='gravel'?64:24),ix=Math.floor(px),iy=Math.floor(py);let nearest=10,shade=.5;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const sx=ix+dx,sy=iy+dy,d=Math.hypot(px-sx-hash(sx,sy)*.7,py-sy-hash(sy,sx)*.7);if(d<nearest){nearest=d;shade=hash(sx,sy)}}h=.4+shade*.35-Math.max(0,nearest-.4)*.5;r=.7+shade*.22+grain*.06;g=r*.98;b=r*.92}
  else if(kind==='foliage'){const lx=(u*48+Math.floor(v*40)%2*.5)%1-.5,ly=(v*40)%1-.5,leaf=Math.max(0,1-(lx*lx/.19+ly*ly/.24)),vein=Math.max(0,1-Math.abs(lx)*35)*leaf;h=.25+leaf*.4+vein*.08+fine*.12;r=.76+.15*leaf+grain*.035;g=.86+.13*leaf;b=.66+.17*leaf}
  else if(kind==='roof'){const seam=(Math.min((u*8)%1,1-(u*8)%1)<.045||Math.min((v*8)%1,1-(v*8)%1)<.055)?1:0;h=.55+.25*fine-seam*.5;r=.85+.1*fine-seam*.25;g=r;b=r*.97}
  const i=(y*size+x)*4;height[y*size+x]=h;pixels[i]=Math.round(255*THREE.MathUtils.clamp(r,0,1));pixels[i+1]=Math.round(255*THREE.MathUtils.clamp(g,0,1));pixels[i+2]=Math.round(255*THREE.MathUtils.clamp(b,0,1));pixels[i+3]=255;
 }
 const normals=new Uint8Array(pixels.length);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const h=(dx,dy)=>height[((y+dy+size)%size)*size+(x+dx+size)%size],nx=(h(-1,0)-h(1,0))*2,ny=(h(0,-1)-h(0,1))*2,len=Math.hypot(nx,ny,1),i=(y*size+x)*4;normals[i]=Math.round((nx/len*.5+.5)*255);normals[i+1]=Math.round((ny/len*.5+.5)*255);normals[i+2]=Math.round((1/len*.5+.5)*255);normals[i+3]=255}
 const texture=(data,space)=>{const t=new THREE.DataTexture(data,size,size);t.colorSpace=space;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t};
 const result={map:texture(pixels,THREE.SRGBColorSpace),normalMap:texture(normals,THREE.NoColorSpace)};cache.set(kind,result);return result;
}
export function forestMaterial(kind,color){
 if(kind==='water'){
  if(!cache.has('water')){const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;data[i]=128+Math.round(Math.sin((x*3+y)*Math.PI*2/size)*24);data[i+1]=128+Math.round(Math.cos((y*4-x)*Math.PI*2/size)*24);data[i+2]=251;data[i+3]=255}const normal=new THREE.DataTexture(data,size,size);normal.wrapS=normal.wrapT=THREE.RepeatWrapping;normal.minFilter=normal.magFilter=THREE.LinearFilter;normal.needsUpdate=true;cache.set('water',{normalMap:normal})}
  const m=new THREE.MeshPhysicalMaterial({color,normalMap:cache.get('water').normalMap,normalScale:new THREE.Vector2(.35,.35),roughness:.18,metalness:.08,transparent:true,opacity:.86,clearcoat:1,clearcoatRoughness:.22,depthWrite:false});m.userData.forestWater=true;return m;
 }
 const p=profiles[kind],m=new THREE.MeshStandardMaterial({color,...maps(kind),roughness:p[1],normalScale:new THREE.Vector2(p[2],p[2]),metalness:kind==='metal'?.45:0});m.userData.worldSurface=kind;m.userData.forestSurface=kind;return m;
}
export function applyForestSurface(mesh,kind){
 if(kind==='water')return;applyWorldSurface(mesh,kind);
 if((kind==='wood'||kind==='bark')&&mesh.geometry.type==='BoxGeometry'){
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=mesh.geometry.attributes.uv,dim=mesh.geometry.parameters,axis=dim.width>=dim.height&&dim.width>=dim.depth?0:dim.depth>=dim.height?2:1,span=profiles[kind][0];
  for(let i=0;i<p.count;i++){const q=[p.getX(i),p.getY(i),p.getZ(i)],normal=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],face=normal.indexOf(Math.max(...normal)),across=[0,1,2].find(a=>a!==axis&&a!==face)??(axis+1)%3;uv.setXY(i,q[across]/span,q[axis]/span)}uv.needsUpdate=true;
 }
}
