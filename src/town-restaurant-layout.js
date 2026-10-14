export const restaurantTables=[[.35,-1],[2.35,-1],[.35,1],[2.35,1]];
export const restaurantSeats=restaurantTables.flatMap(([x,z])=>[-.6,.6].map(dz=>({x,z:z+dz,heading:dz<0?0:Math.PI})));
export const restaurantCounter={x:-3.35,z:1.35};
export const restaurantQueuePoint=index=>({x:-1.8,z:1.65-index*.45});
