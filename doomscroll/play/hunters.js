/* Woodland threat rules: bounded speeds, sight, sound and last-seen searching. */
'use strict';
(()=>{
 const chaseSpeeds=[28,34,40,46],patrolSpeeds=[14,16,18,20];
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function speed(count,chasing=false){return(chasing?chaseSpeeds:patrolSpeeds)[Math.max(0,Math.min(3,count))];}
 function update(enemies,dt,o){let threatened=false,caught=false;
  for(const e of enemies){if(!e.active)continue;if(e.wake>0){e.wake=Math.max(0,e.wake-dt);continue;}e.time+=dt;const d=distance(e,o.player),visible=!o.inside&&(!o.hidden||o.torch)&&o.grace<=0;
   const axis={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[e.face]||[0,1],front=((o.player.x-e.x)*axis[0]+(o.player.y-e.y)*axis[1])/Math.max(1,d)>-.15;
   const sees=visible&&d<(o.torch?205:105)&&(front||e.mode==='chase')&&o.lineOfSight(e,o.player),hears=visible&&o.sprinting&&d<120;
   if(o.pursuit||sees||hears){e.mode='chase';e.last={...o.player};e.time=0;}
   else if(e.mode==='chase'&&e.time>4){e.mode='search';e.time=0;}
   else if(e.mode==='search'&&e.time>6){e.mode='patrol';e.time=0;}
   const target=e.mode==='patrol'?e.patrol[e.waypoint]:e.last;
   if(e.mode==='patrol'&&distance(e,target)<16)e.waypoint=(e.waypoint+1)%e.patrol.length;
   if(!(o.pursuit&&o.pursuitTime<3))o.moveEnemy(target,dt,e,speed(o.count,e.mode==='chase'));
   if(!o.inside&&e.mode==='chase'&&distance(e,o.player)<190)threatened=true;
   if(visible&&distance(e,o.player)<12){caught=true;break;}
  }
  return{threatened,caught};
 }
 window.CampHunt={speed,update};
})();
