/* Readable hunters: suspicion, last-seen searches and a short escapeable grab. */
'use strict';
(()=>{
 const chaseSpeeds=[28,34,40,46],patrolSpeeds=[14,16,18,20];
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function speed(count,chasing=false){return(chasing?chaseSpeeds:patrolSpeeds)[Math.max(0,Math.min(3,count))];}
 function update(enemies,dt,o){let threatened=false,suspicious=false,caught=false,grabbing=false,pressure=0,side=0;
  for(const e of enemies){
   if(!e.active)continue;
   if(e.wake>0){e.wake=Math.max(0,e.wake-dt);e.grab=0;continue;}
   e.time+=dt;e.notice=e.notice||0;e.grab=e.grab||0;e.hesitate=Math.max(0,(e.hesitate||0)-dt);
   const d=distance(e,o.player),visible=!o.inside&&(!o.hidden||o.torch)&&o.grace<=0;
   const axis={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[e.face]||[0,1],front=((o.player.x-e.x)*axis[0]+(o.player.y-e.y)*axis[1])/Math.max(1,d)>-.15;
   const sees=visible&&d<(o.torch?205:105)&&(front||e.mode==='chase')&&o.lineOfSight(e,o.player),hears=visible&&o.sprinting&&d<120;
   e.notice=sees?Math.min(1,e.notice+dt/.55):Math.max(0,e.notice-dt*1.5);
   if(o.pursuit||sees&&(e.notice>=1||e.mode==='chase')){
    if(e.mode!=='chase')e.hesitate=.35;
    e.mode='chase';e.last={...o.player};e.time=0;
   }else if(hears&&e.mode!=='chase'){
    // Running sends a hunter to the sound, not through walls to an unseen player.
    e.mode='search';e.last={...o.player};e.time=0;
   }else if(e.mode==='chase'&&e.time>4){e.mode='search';e.time=0;}
   else if(e.mode==='search'&&e.time>6){e.mode='patrol';e.time=0;}
   const target=e.mode==='patrol'?e.patrol[e.waypoint]:e.last;
   if(e.mode==='patrol'&&distance(e,target)<16)e.waypoint=(e.waypoint+1)%e.patrol.length;
   if(!e.hesitate&&!(o.pursuit&&o.pursuitTime<3))o.moveEnemy(target,dt,e,speed(o.count,e.mode==='chase'));
   const after=distance(e,o.player);
   if(!o.inside&&e.mode==='chase'&&after<190){threatened=true;const amount=Math.max(.12,1-after/190);if(amount>pressure){pressure=amount;side=Math.max(-.8,Math.min(.8,(e.x-o.player.x)/120));}}
   if(!o.inside&&e.mode!=='chase'&&(e.notice>0||e.mode==='search'&&after<135))suspicious=true;
   const touching=visible&&!e.hesitate&&after<13&&o.lineOfSight(e,o.player)&&!(o.pursuit&&o.pursuitTime<3);
   e.grab=touching?e.grab+dt:0;
   if(e.grab>0){grabbing=true;pressure=1;}
   if(e.grab>=.6){caught=true;break;}
  }
  return{threatened,suspicious,caught,grabbing,pressure,side};
 }
 window.CampHunt={speed,update};
})();
