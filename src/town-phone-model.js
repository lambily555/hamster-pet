import * as THREE from 'three';
export function createPhoneModel(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(400,740,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.15,2.15,3.98,-3.98,.1,30);camera.position.set(0,0,12);
  scene.add(new THREE.HemisphereLight(0xfff6e7,0xb87955,1.6));const light=new THREE.DirectionalLight(0xffffff,1.8);light.position.set(-4,5,8);scene.add(light);
  const cream=new THREE.MeshStandardMaterial({color:0xffe7c9,roughness:.96}),pink=new THREE.MeshStandardMaterial({color:0xf8afa1,roughness:.9}),brown=new THREE.MeshStandardMaterial({color:0x693e29,roughness:.36}),dark=new THREE.MeshStandardMaterial({color:0x30231b,roughness:.38});
  const grain=document.createElement('canvas');grain.width=grain.height=128;const ctx=grain.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=7;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const c=150+seed%100;pixels.data.set([c,c,c,255],i)}ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(grain);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,6);cream.bumpMap=texture;cream.bumpScale=.035;
  function oval(mat,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);scene.add(mesh);return mesh}
  function rounded(mat,w,h,r,x,y,z,depth){const s=new THREE.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3,steps:1,curveSegments:12}),mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh}
  rounded(cream,3.25,6.38,.49,0,-.38,0,.35);rounded(brown,2.99,5.22,.37,0,-.82,.41,.02);
  for(const side of [-1,1]){oval(cream,side*1.19,2.97,.03,.73,.87,.25);oval(pink,side*1.19,2.99,.23,.51,.63,.09);oval(brown,side*.65,2.23,.49,.18,.23,.08);oval(new THREE.MeshBasicMaterial({color:0xffffff}),side*.65-.04,2.31,.57,.045,.055,.02);oval(pink,side*1.02,1.98,.46,.22,.1,.05);oval(cream,side*1.65,-.8,.42,.22,.42,.22);oval(cream,side*1.1,-3.51,.4,.39,.19,.25)}
  oval(pink,0,2.16,.5,.13,.08,.06);rounded(dark,.48,.09,.04,0,2.64,.45,.02);oval(dark,.39,2.64,.48,.055,.055,.03);rounded(new THREE.MeshStandardMaterial({color:0xfffaf0}),.24,.23,.06,0,1.94,.48,.02);
  const tail=new THREE.CatmullRomCurve3([new THREE.Vector3(1.35,-3.3,-.1),new THREE.Vector3(1.96,-3,-.1),new THREE.Vector3(2,-2.5,-.1),new THREE.Vector3(1.7,-2.55,-.1)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(tail,28,.11,10,false),pink));
  for(const side of [-1,1])for(const offset of [-.1,.1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*1.12,2.12+offset,.5),new THREE.Vector3(side*1.46,2.15+offset,.5),new THREE.Vector3(side*1.7,2.2+offset,.47)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.018,6,false),brown))}
  const mouth=new THREE.CatmullRomCurve3([new THREE.Vector3(-.27,2.1,.53),new THREE.Vector3(-.15,2,.56),new THREE.Vector3(0,2.08,.56),new THREE.Vector3(.15,2,.56),new THREE.Vector3(.27,2.1,.53)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(mouth,20,.018,6,false),brown));
  renderer.render(scene,camera);
  return {dispose(){scene.traverse(o=>{o.geometry?.dispose()});for(const m of new Set(scene.children.filter(o=>o.material).map(o=>o.material)))m.dispose();texture.dispose();renderer.dispose()}};
}
window.createTownPhoneModel=createPhoneModel;
