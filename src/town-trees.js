import * as THREE from 'three';
import {worldMaterial} from './town-world-surfaces.js';

// The same 34 boundary positions, with shared geometry and four instanced draws.
export function createBoundaryTrees(){
 const group=new THREE.Group();group.name='外围树木';
 const count=34,trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.065,.11,.65,9),worldMaterial('bark',0x80644d),count);
 const branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.016,.035,1,7),trunks.material,count*3);
 const crowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,9,7),worldMaterial('foliage',0x7b9b60),count*7);
 const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),worldMaterial('foliage',0x8fa76c),count*42);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),color=new THREE.Color();
 const put=(batch,index,x,y,z,sx,sy,sz,yaw=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();batch.setMatrixAt(index,dummy.matrix)};
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2,x=Math.cos(angle)*17.1,z=Math.sin(angle)*17.1,height=.94+(i%5)*.035;
  put(trunks,i,x,.325*height,z,1,height,1);
  for(let j=0;j<3;j++){
   const a=angle+j*Math.PI*2/3,start=new THREE.Vector3(x,.4*height,z),end=new THREE.Vector3(x+Math.cos(a)*.2,.8*height,z+Math.sin(a)*.2),direction=end.clone().sub(start);
   dummy.position.copy(start).lerp(end,.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(1,direction.length(),1);dummy.updateMatrix();branches.setMatrixAt(i*3+j,dummy.matrix);
  }
  for(let j=0;j<7;j++){
   const a=j*2.4+angle,r=j===6?0:.2,y=j===6?1.02:.78+(j%2)*.13;
   put(crowns,i*7+j,x+Math.cos(a)*r,y*height,z+Math.sin(a)*r,.21,.23*height,.2,a);
   crowns.setColorAt(i*7+j,color.setHSL(.25+(i%3)*.012,.23,.68+(j%3)*.04));
  }
  for(let j=0;j<42;j++){
   const cluster=j%7,a=cluster*2.4+angle,r=cluster===6?0:.2,cy=cluster===6?1.02:.78+(cluster%2)*.13;
   const phi=j*2.39996,theta=(Math.floor(j/7)+.5)*Math.PI/6,normal=new THREE.Vector3(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
   dummy.position.set(x+Math.cos(a)*r+normal.x*.21,(cy+normal.y*.23)*height,z+Math.sin(a)*r+normal.z*.2);dummy.quaternion.setFromUnitVectors(up,normal);dummy.scale.set(.08,.014,.042);dummy.updateMatrix();leaves.setMatrixAt(i*42+j,dummy.matrix);
   leaves.setColorAt(i*42+j,color.setHSL(.23+(j%3)*.015,.28,.65+(j%4)*.04));
  }
 }
 for(const mesh of [trunks,branches,crowns,leaves]){mesh.receiveShadow=true;mesh.castShadow=mesh!==leaves;mesh.computeBoundingSphere();group.add(mesh)}
 group.userData.treeCount=count;return group;
}
