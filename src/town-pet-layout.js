// Room-local pet furniture stays clear of the hamster's bed, table and doorway.
export const cottagePetFurniture={beds:[[.25,-.25],[1.25,-.25]],grain:[1.3,-1.6,.22,.22],toy:[2.5,-.65,.15,.2],bowls:[[.7,1.05],[1.15,1.05]]};

// Shop-local positions behind the free-adoption sign (z=-.15), clear of the beds.
export function freePetSlot(index,count){
 const columns=Math.max(1,Math.ceil(Math.sqrt(Math.max(1,count)*4))),rows=Math.ceil(Math.max(1,count)/columns),width=2.4/columns,depth=.6/rows;
 return {x:-3.55+width*(index%columns+.5),z:-.95+depth*(Math.floor(index/columns)+.5),size:Math.min(.25,width*.4,depth*.4)};
}
