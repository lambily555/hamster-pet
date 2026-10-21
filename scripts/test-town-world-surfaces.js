const assert=require('node:assert/strict'),esbuild=require('esbuild'),THREE=require('three');
esbuild.buildSync({stdin:{contents:`export * from './src/town-world-surfaces.js';export {createBoundaryTrees} from './src/town-trees.js';export {createCemetery,createPlaza,createGarden,createWheelPark} from './src/town-grounds.js';export {createTownVerges} from './src/town-verges.js';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',external:['three'],outfile:'temp/town-materials/world-test.cjs',logLevel:'silent'});
const previousDocument=global.document,previousWindow=global.window;
global.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
global.window={TownI18n:{canvas:(texture,paint)=>paint(()=>{})}};
try{
 const api=require('../temp/town-materials/world-test.cjs'),start=performance.now(),maps=new Set();
 for(const kind of ['grass','soil','gravel','stone','roof','bark','foliage','paint','metal','fabric','wood','enamel']){
  const a=api.worldMaterial(kind,0xffffff),b=api.worldMaterial(kind,0x888888);
  assert.equal(a.map,b.map);assert.equal(a.bumpMap,b.bumpMap);maps.add(a.map);maps.add(a.bumpMap);
  assert.equal(a.map.colorSpace,THREE.SRGBColorSpace);assert.equal(a.bumpMap.colorSpace,THREE.NoColorSpace);
  assert.equal(a.map.image.width,256);assert.ok(a.map.generateMipmaps);assert.ok(a.bumpScale<=.012);
 }
 assert.equal(maps.size,24,'all scene instances reuse twelve small map pairs');
 console.log('Twelve shared texture pairs generated in '+Math.round(performance.now()-start)+' ms; no extra geometry or draw calls.');
 for(const factory of ['createCemetery','createPlaza','createGarden','createWheelPark','createTownVerges']){
  const group=api[factory](),before=[];group.traverse(o=>{if(o.isMesh)before.push({mesh:o,positions:Array.from(o.geometry.attributes.position.array),transform:o.matrix.clone(),data:JSON.stringify(o.userData),map:o.material.map})});
  api.finishWorldSurfaces(group);let count=0;group.traverse(o=>{if(o.isMesh)count++});assert.equal(count,before.length);
  for(const {mesh,positions,map,transform,data} of before){assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions);assert.ok(mesh.matrix.equals(transform));const saved=JSON.parse(data);for(const key of Object.keys(saved))assert.deepEqual(mesh.userData[key],saved[key],'interaction metadata remains intact');if(map)assert.equal(mesh.material.map,map);assert.ok(Array.from(mesh.geometry.attributes.uv.array).every(Number.isFinite))}
 }
 const shared=new THREE.BoxGeometry(1,1,1),group=new THREE.Group();
 const a=new THREE.Mesh(shared,new THREE.MeshStandardMaterial()),b=new THREE.Mesh(shared,new THREE.MeshStandardMaterial());a.scale.x=2;group.add(a,b);const originalUV=Array.from(shared.attributes.uv.array);api.finishWorldSurfaces(group);assert.deepEqual(Array.from(shared.attributes.uv.array),originalUV);assert.notEqual(a.geometry,b.geometry);
 for(const material of [new THREE.MeshStandardMaterial({transparent:true}),new THREE.MeshStandardMaterial({emissive:0xffddaa}),new THREE.MeshStandardMaterial({roughness:.1}),new THREE.MeshBasicMaterial(),new THREE.MeshStandardMaterial({map:new THREE.Texture()})]){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(),material);api.finishWorldSurfaces(mesh);assert.equal(mesh.material,material,'glass, lights, eyes, labels and authored images are protected');
 }
 const trees=api.createBoundaryTrees();assert.equal(trees.userData.treeCount,34);assert.equal(trees.children.length,4);let triangles=0;const matrix=new THREE.Matrix4(),point=new THREE.Vector3();for(const mesh of trees.children){assert.ok(mesh.isInstancedMesh);assert.ok(mesh.material.map);assert.ok(Array.from(mesh.instanceMatrix.array).every(Number.isFinite));triangles+=(mesh.geometry.index.count/3)*mesh.count;}assert.ok(triangles<80000,'bounded tree detail');for(let i=0;i<34;i++){trees.children[0].getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);assert.ok(Math.abs(Math.hypot(point.x,point.z)-17.1)<1e-5)}console.log('34 trees: four instanced draws, '+triangles+' triangles, boundary positions retained.');
 const cemetery=api.createCemetery();api.finishWorldSurfaces(cemetery);let disposed=0;const stoneMap=api.worldMaterial('stone',0xffffff).map;stoneMap.addEventListener('dispose',()=>disposed++);
 const records=Array.from({length:26},(_,i)=>({id:'resident-'+i,name:'Resident '+i}));cemetery.userData.setMemorials(records);cemetery.userData.setMemorialPage(1);cemetery.userData.setMemorials(records.slice(0,9));assert.equal(disposed,0,'rebuilding graves must not dispose textures shared by surviving models');assert.equal(cemetery.userData.wallNames.length,1);assert.equal(cemetery.userData.graveNames.length,8);
 cemetery.traverse(o=>{if(o.isMesh&&o.material.userData.worldSurface)assert.ok(o.material.map)});
 console.log('Outdoor factories, shared geometry, protected materials and dynamic grave/urn-wall refresh passed. No App launched.');
}finally{global.document=previousDocument;global.window=previousWindow}
