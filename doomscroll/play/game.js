/* Doom Scroll v0.9 — portrait-first, top-down pixel art.
   The map and camera use world coordinates; Canvas stays crisp at any phone size.
   SugarSmush retains its independently tested, single-round match-three engine. */
'use strict';
const $=id=>document.getElementById(id),canvas=$('screen'),ctx=canvas.getContext('2d');
const W=360,MAP_W=720,MAP_H=1280;let H=640;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer: coarse)').matches;
const ui={cover:$('cover'),hud:$('hud'),caption:$('caption'),skip:$('skip'),dialogue:$('dialogue'),pause:$('pause-panel'),end:$('end-panel'),touch:$('touch-controls')};
const positions={cabin:{x:490,y:764},sign:{x:402,y:1051}},fire={x:360,y:846};
const gateway={x:304,y:1045,w:114,h:93};
// One continuous main trail skirts cabin 03. Short spurs end at doors/clues.
const paths=[{x:270,y:1135},{x:292,y:1040},{x:333,y:954},{x:370,y:917},{x:424,y:874},{x:491,y:822},{x:586,y:798},{x:586,y:635},{x:550,y:595},{x:510,y:411},{x:510,y:350}];
const branches=[[{x:586,y:779},{x:490,y:779}],[{x:510,y:411},{x:385,y:477},{x:294,y:498},{x:306,y:555},{x:327,y:600},{x:331,y:662}],[{x:586,y:798},{x:605,y:835},{x:610,y:870}],[{x:331,y:662},{x:303,y:700},{x:303,y:746},{x:285,y:869},{x:303,y:937},{x:333,y:954}]];
const cabins=[{x:119,y:758,w:113,h:94,n:'01'},{x:135,y:569,w:123,h:95,n:'02'},{x:430,y:650,w:120,h:100,n:'03'},{x:383,y:233,w:108,h:90,n:'04'}];
const bushes=[{x:429,y:801},{x:575,y:483},{x:267,y:945},{x:560,y:356}];
const sceneryClearances=[{x:620,y:770,w:100,h:186},{x:580,y:839,w:48,h:62},{x:250,y:600,w:128,h:82},{x:304,y:515,w:72,h:67},{x:350,y:978,w:110,h:80},{x:120,y:1120,w:190,h:86},{x:241,y:940,w:127,h:108},...cabins.map(c=>({x:c.x-16,y:c.y-14,w:c.w+34,h:c.h+35}))];
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function canopyBounds(t){return{x:t.x-31,y:t.y-t.h-3,w:62,h:t.h+13};}
const trees=[],rocks=[],specks=[];
let seed=74;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const terrain=document.createElement('canvas');terrain.width=MAP_W;terrain.height=MAP_H;const ground=terrain.getContext('2d');
function nearPath(x,y,margin=35){return [paths,...branches].some(route=>route.some((p,i)=>{if(!i)return false;const a=route[i-1],dx=p.x-a.x,dy=p.y-a.y,k=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(x-a.x-dx*k,y-a.y-dy*k)<margin;}));}
function generateWorld(){
 ground.fillStyle='#1e3027';ground.fillRect(0,0,MAP_W,MAP_H);
 for(let i=0;i<11000;i++){const x=rnd()*MAP_W,y=rnd()*MAP_H;ground.fillStyle=['#26382c','#243c2b','#172e26','#33432c','#3e4b31'][i%5];ground.fillRect(x,y,rnd()>.88?3:1,rnd()>.9?2:1);}
 for(let i=0;i<140;i++){const x=rnd()*MAP_W,y=rnd()*MAP_H;ground.fillStyle='#102c201c';ground.fillRect(x,y,12+rnd()*34,5+rnd()*19);}
 // Stroke the whole network once per layer, so junctions share the same texture.
 ground.lineJoin='round';ground.lineCap='round';
 for(const [width,color] of [[58,'#374b35'],[35,'#5b5a40'],[21,'#756b4c']]){ground.strokeStyle=color;ground.lineWidth=width;ground.beginPath();for(const route of [paths,...branches])route.forEach((p,i)=>i?ground.lineTo(p.x,p.y):ground.moveTo(p.x,p.y));ground.stroke();}
 ground.fillStyle='#464d36';ground.beginPath();ground.ellipse(fire.x,fire.y,94,72,0,0,Math.PI*2);ground.fill();
 ground.fillStyle='#434b37';ground.fillRect(40,1123,640,65);ground.fillStyle='#65664c';ground.fillRect(40,1139,640,2);ground.fillStyle='#777150';for(let x=48;x<680;x+=30)ground.fillRect(x,1168,15,1);
 for(let i=0;i<2200;i++){const x=rnd()*MAP_W,y=rnd()*MAP_H;if(nearPath(x,y)||dist({x,y},fire)<80){ground.fillStyle=['#817351','#484e37','#94805a'][i%3];ground.fillRect(x,y,i%5?1:3,1);}}
 // Tread marks, small puddles and fallen leaves establish a used, damp campsite.
 for(let i=0;i<12;i++){ground.fillStyle='#3a4431';ground.fillRect(235+i*4,1080-i*12,3,5);ground.fillRect(242+i*4,1085-i*12,3,5);}
 for(const p of [{x:330,y:960},{x:515,y:570},{x:490,y:465}]){ground.fillStyle='#30473d';ground.fillRect(p.x-8,p.y,26,5);ground.fillStyle='#6f806249';ground.fillRect(p.x-5,p.y+1,11,1);}
 for(let i=0;i<260;i++){
  const x=30+rnd()*(MAP_W-60),y=45+rnd()*(MAP_H-80);
  if(dist({x,y},positions.sign)<56||dist({x,y},gateway)<77||nearPath(x,y,43)||dist({x,y},fire)<110||cabins.some(c=>x>c.x-33&&x<c.x+c.w+33&&y>c.y-20&&y<c.y+c.h+65)||dist({x,y},{x:595,y:360})<35|| (y>1070&&x<350)||bushes.some(b=>dist({x,y},b)<25))continue;
  const t={x:Math.floor(x),y:Math.floor(y),h:47+Math.floor(rnd()*30),type:i%3,tone:Math.floor(rnd()*3)};if(sceneryClearances.some(r=>overlaps(canopyBounds(t),r)))continue;let coversTrail=false;for(let yy=t.y-t.h;yy<=t.y;yy+=8)if(nearPath(t.x,yy,48)){coversTrail=true;break;}if(!coversTrail)trees.push(t);
 }
 for(let i=0;i<38;i++){const x=25+rnd()*(MAP_W-50),y=30+rnd()*(MAP_H-60);if(!nearPath(x,y,42)&&!sceneryClearances.some(r=>overlaps({x:x-8,y:y-9,w:17,h:19},r)))rocks.push({x,y});}
 for(let i=0;i<40;i++)specks.push({x:rnd()*MAP_W,y:rnd()*MAP_H,s:rnd()*6});
}
generateWorld();
const blockers=cabins.map(c=>({x:c.x-3,y:c.y+5,w:c.w+6,h:c.h-1}));blockers.push({x:gateway.x-gateway.w/2-2,y:gateway.y-5,w:7,h:9},{x:gateway.x+gateway.w/2-4,y:gateway.y-5,w:7,h:9},{x:positions.sign.x-3,y:positions.sign.y-4,w:6,h:8},{x:fire.x-16,y:fire.y-10,w:32,h:20},{x:636,y:793,w:84,h:145});
let state='menu',gameTime=0,introTime=0,paused=false,player,enemy,enemies=[],camera={x:180,y:545};
let torch=false,hasTorch=false,hidden=false,near=null,dialogueLines=[],dialogueNext=null,subtitleTimer=0,transition=0;
let keys={},move={x:0,y:0},stickPointer=null,soundEnabled=false,lastStep=0,lastCrackle=0,lastPop=-1,flash=0;
let pursuit=false,pursuitTime=0,sprintLocked=false,lastEnemyStep=0;
let stamina=6,sprinting=false,grace=0,caughtTime=0,outroTime=0,nextEvent=20,eventGhost=null,runSeed=1;
let room=null,outsidePosition=null,search=null,outcome=null,runStartedAt=null,runEndedAt=null,encounterDone=false;
const phones=[{id:'martha',name:'Martha',x:214,y:143,place:'03',label:'Martha’s bedside table',color:'#e5a0bf',collected:false},{id:'liam',name:'Liam',x:331,y:680,place:'outside',label:'Liam’s phone',color:'#8bb7ea',collected:false},{id:'willow',name:'Willow',x:610,y:870,place:'outside',label:'Willow’s phone',color:'#c6a9e9',collected:false}];
const busDoor={x:192,y:1135};
const npcs=[{x:414,y:912,c:'#a1aa78',name:'CAMP LEADER',lines:['Missing? We prefer the word disconnected.','Everyone finds themselves here. Eventually.']},{x:303,y:937,c:'#a78b72',name:'NIGHT PORTER',lines:['Martha went back to cabin 03. Liam dropped his phone by the washing line. Willow was taking selfies by the lake.','Find their phones. Take them as evidence. The minibus keys are in the ignition.']},{x:334,y:558,c:'#8d9c97',name:'JUNE',lines:['Liam was messaging someone called Olivia. He kept laughing at his screen.','Then a man with no shoes came out of the woods. I stopped laughing.','They follow light and footsteps. Keep the torch off near them. Hide until they pass.']}];
function collectedCount(){return phones.filter(p=>p.collected).length;}
function worldPlayer(){return room?outsidePosition:player;}
function runSeconds(){return runStartedAt===null?0:Math.max(0,((runEndedAt??Date.now())-runStartedAt)/1000);}
function eventRandom(){runSeed=(runSeed*1664525+1013904223)>>>0;return runSeed/4294967296;}
function resetWorld(){
 window.CampAudio?.silence();pursuit=false;pursuitTime=0;sprintLocked=false;lastEnemyStep=0;
 player={x:277,y:1090,face:'up',walk:0,phone:false};
 enemies=[{x:595,y:360,home:{x:595,y:360},patrol:[{x:595,y:360},{x:586,y:635},{x:586,y:779},{x:510,y:411}],color:'#30473a'},{x:303,y:620,home:{x:303,y:620},patrol:[{x:303,y:620},{x:303,y:937},{x:360,y:846},{x:294,y:498}],color:'#4a4039'}].map(e=>({...e,mode:'patrol',last:{...e.home},time:0,active:true,route:[],replan:0,waypoint:0,face:'down'}));enemy=enemies[0];
 phones.forEach(p=>p.collected=false);gameTime=0;torch=false;hasTorch=false;hidden=false;paused=false;keys={};move={x:0,y:0};near=null;flash=0;subtitleTimer=0;dialogueLines=[];dialogueNext=null;stamina=6;grace=5;room=null;outsidePosition=null;search=null;outcome=null;runStartedAt=null;runEndedAt=null;encounterDone=false;caughtTime=0;outroTime=0;nextEvent=18+Math.random()*7;eventGhost=null;runSeed=Date.now()>>>0;lastStep=0;ui.caption.textContent='';resetStick();window.SugarSmush.reset();window.CampPhones?.reset();
 [ui.end,ui.pause,ui.dialogue,$('hide-note'),$('danger'),$('search-progress')].forEach(e=>e.classList.add('hidden'));$('pause').textContent='Ⅱ';updateHUD();
}
// Cached navigation keeps woodland patrols moving around cabins and tree trunks.
const NAV_STEP=10,NAV_W=Math.floor(MAP_W/NAV_STEP),NAV_H=Math.floor(MAP_H/NAV_STEP),nav=new Uint8Array(NAV_W*NAV_H);
for(let y=0;y<NAV_H;y++)for(let x=0;x<NAV_W;x++)nav[y*NAV_W+x]=blocked(x*NAV_STEP+5,y*NAV_STEP+5)?0:1;
function nearestNav(p){const sx=Math.floor(p.x/NAV_STEP),sy=Math.floor(p.y/NAV_STEP);for(let r=0;r<7;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=sx+dx,y=sy+dy;if(x>=0&&x<NAV_W&&y>=0&&y<NAV_H&&nav[y*NAV_W+x])return y*NAV_W+x;}return -1;}
function planRoute(from,to){const start=nearestNav(from),end=nearestNav(to);if(start<0||end<0)return [];const parent=new Int32Array(nav.length);parent.fill(-1);const queue=new Int32Array(nav.length);let head=0,tail=1;queue[0]=start;parent[start]=start;
 while(head<tail){const i=queue[head++];if(i===end)break;const x=i%NAV_W,y=Math.floor(i/NAV_W);for(const j of [x>0?i-1:-1,x<NAV_W-1?i+1:-1,y>0?i-NAV_W:-1,y<NAV_H-1?i+NAV_W:-1])if(j>=0&&nav[j]&&parent[j]===-1){parent[j]=i;queue[tail++]=j;}}
 if(parent[end]===-1)return [];const route=[];for(let i=end;i!==start;i=parent[i])route.push({x:(i%NAV_W)*NAV_STEP+5,y:Math.floor(i/NAV_W)*NAV_STEP+5});return route.reverse();
}
function steerEnemy(target,dt,e=enemy,speed=window.CampHunt.speed(collectedCount(),e.mode==='chase')){e.replan-=dt;if(e.replan<=0){e.route=planRoute(e,target);e.replan=pursuit?.35:.8;}
 while(e.route.length&&dist(e,e.route[0])<5)e.route.shift();for(let i=Math.min(10,e.route.length-1);i>0;i--)if(lineOfSight(e,e.route[i])){e.route.splice(0,i);break;}
 const next=e.route[0]||target,dx=next.x-e.x,dy=next.y-e.y,d=Math.hypot(dx,dy);if(d>2){const step=Math.min(d,speed*dt);moveBody(e,dx/d*step,dy/d*step);e.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}}
function lineOfSight(a,b){const d=dist(a,b),steps=Math.ceil(d/12);for(let i=1;i<steps;i++)if(blocked(lerp(a.x,b.x,i/steps),lerp(a.y,b.y,i/steps)))return false;return true;}
function tone(freq,duration,volume=.025,type='sine',slide=0){if(soundEnabled)window.CampAudio?.tone(freq,duration,volume,type,slide);}
function hiss(duration=.12,volume=.035,freq=1100){if(soundEnabled)window.CampAudio?.hiss(duration,volume,freq);}
function soundFX(kind,amount=1,pan=0){if(soundEnabled)window.CampAudio?.fx(kind,amount,pan);}
function setSound(enabled){soundEnabled=window.CampAudio?.enable(enabled)||false;$('sound').textContent=soundEnabled?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',soundEnabled?'Mute sound':'Enable sound');$('audio-opt').checked=soundEnabled;}
function say(text,seconds=4){ui.caption.textContent=text;subtitleTimer=seconds;}
function start(withIntro=true){
  resetWorld();runStartedAt=Date.now();$('game').classList.remove('menu-screen');ui.cover.classList.add('hidden');setSound($('audio-opt').checked);canvas.focus();
  if(withIntro){state='intro';introTime=0;lastPop=-1;ui.skip.classList.remove('hidden');ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');}
  else enterPlay();
}
function enterPlay(){state='play';introTime=30;ui.skip.classList.add('hidden');ui.hud.classList.remove('hidden');ui.touch.classList.remove('hidden');camera.x=clamp(player.x-W/2,0,MAP_W-W);camera.y=clamp(player.y-H*.57,0,MAP_H-H);say('Martha, Liam and Willow are missing. Find their phones. Then get out.',6);updateHUD();}
function openDialogue(who,lines,next=null){
 cancelSearch();if(state!=='play')return;state='dialogue';keys={};resetStick();dialogueLines=[...lines];dialogueNext=next;$('speaker').textContent=who;ui.dialogue.classList.remove('hidden');advanceDialogue();$('continue').focus();
}
function advanceDialogue(){
 if(dialogueLines.length){$('line').textContent=dialogueLines.shift();tone(240,.055,.01,'triangle');}
 else{ui.dialogue.classList.add('hidden');state='play';const cb=dialogueNext;dialogueNext=null;if(cb)cb();canvas.focus();}
}
function updateHUD(){
 const count=collectedCount();$('viewport').classList.toggle('inside-cabin',!!room);
 $('location-label').textContent=formatTime(22*60+14+Math.floor(gameTime/60));
 $('torch-status').textContent=hasTorch?(torch?'TORCH ON':'TORCH OFF'):'';
 for(const p of phones){const b=$('inv-'+p.id);b.disabled=!p.collected||pursuit;b.classList.toggle('collected',p.collected);b.setAttribute('aria-label',p.collected?`Open ${p.name}’s phone`:`${p.name}’s phone — not found`);}
 $('phone-count').textContent=count+' / 3';$('torch').style.opacity=hasTorch?'1':'.45';$('torch').textContent=torch?'OFF':'TORCH';
 const labels={phone:'TAKE',search:'SEARCH',torch:'TAKE',door:'LEAVE',cabin:'ENTER',bush:'HIDE',leave:'LEAVE',bus:'BUS',note:'READ',bunk:'HIDE'};
 $('action').textContent=search?'SEARCHING':hidden?'LEAVE':labels[near?.kind]||'ACT';
 $('run-label').textContent=pursuit?'RUN!':'RUN';$('run').classList.toggle('running',sprinting);$('stamina-fill').style.width=(stamina/(pursuit?10:6)*100)+'%';
}
function cabinDoor(c){return{x:c.x+c.w/2,y:c.y+c.h+14};}
function enterCabin(c){
 if(state!=='play'||pursuit)return false;cancelSearch();outsidePosition=cabinDoor(c);room=c;hidden=false;torch=false;player.x=180;player.y=344;keys={};resetStick();soundFX('door',.45);
 say(c.n==='03'?'Empty bunks. A torch in the dresser. Something buzzing by Martha’s bed.':'The cabin is empty. Search the note on the back wall.',5);updateHUD();return true;
}
function leaveCabin(){
 if(!room)return false;cancelSearch();player.x=outsidePosition.x;player.y=outsidePosition.y;room=null;outsidePosition=null;hidden=false;keys={};resetStick();grace=Math.max(grace,3);soundFX('door',.4);$('hide-note').classList.add('hidden');if(collectedCount()===2&&!encounterDone)startEncounter();updateHUD();return true;
}
function findNearby(){
 if(hidden)return{kind:'leave',label:'E / ACT — leave hiding place'};
 let list;
 if(room){const it=window.CampRooms.items;list=[{kind:'door',...it.door,label:'E / ACT — leave cabin'},{kind:'note',...it.note,label:'E / ACT — read the note'},{kind:'bunk',...it.hide,label:'E / ACT — hide under the bunk'}];
  if(room.n==='03'){if(!hasTorch)list.push({kind:'torch',...it.torch,label:'E / ACT — take the torch'});else if(!phones[0].collected)list.push({...phones[0],kind:'search',label:'E / ACT — search Martha’s bedside table'});}
 }else if(pursuit){return dist(player,busDoor)<40?{kind:'bus',...busDoor,label:'Keep moving to the bus door — automatic escape'}:null;}
 else{list=[...cabins.map(c=>({kind:'cabin',...cabinDoor(c),cabin:c,label:'E / ACT — enter cabin '+c.n})),{kind:'bus',...busDoor,label:'E / ACT — inspect the minibus'},
  {kind:'sign',...positions.sign,label:'E / ACT — read camp rules'},{kind:'pile',x:fire.x+43,y:fire.y,label:'E / ACT — inspect the burned phones'},
  ...bushes.map(b=>({...b,kind:'bush',label:'E / ACT — hide in bushes'})),...npcs.map(n=>({...n,kind:'npc',label:'E / ACT — talk to '+n.name}))];
  list.push(...phones.filter(p=>p.place==='outside'&&!p.collected).map(p=>({...p,kind:'phone',label:'E / ACT — take '+p.name+'’s phone'})));
 }
 return list.filter(o=>dist(player,o)<29).sort((a,b)=>dist(player,a)-dist(player,b))[0]||null;
}
function cancelSearch(){search=null;$('search-progress').classList.add('hidden');}
function beginSearch(id){if(search||state!=='play')return;const p=phones.find(p=>p.id===id);if(!p||p.collected)return;search={id,time:0,origin:{x:player.x,y:player.y}};soundFX('pickup',.4);$('search-progress').classList.remove('hidden');$('search-label').textContent='SEARCHING '+p.label.toUpperCase();$('search-fill').style.width='0%';say('Keep still to search. Move to cancel.',2);}
function updateSearch(dt){if(!search)return;if(dist(player,search.origin)>3){cancelSearch();return;}search.time+=dt;$('search-fill').style.width=Math.min(100,search.time/2*100)+'%';if(search.time>=2){const id=search.id;cancelSearch();pickupPhone(id);}}
function interact(){
 if(paused)return;if(state==='dialogue'){advanceDialogue();return;}if(state!=='play')return;near=findNearby();if(!near)return;
 if(near.kind==='leave'){hidden=false;$('hide-note').classList.add('hidden');grace=Math.max(grace,1);updateHUD();return;}
 if(near.kind==='door'){leaveCabin();return;}
 if(pursuit)return;
 if(near.kind==='cabin')enterCabin(near.cabin);
 else if(near.kind==='torch'){hasTorch=true;torch=true;soundFX('torch');say('Torch secured. Search the little table beside Martha’s bunk.',5);updateHUD();}
 else if(near.kind==='phone')pickupPhone(near.id);
 else if(near.kind==='search')beginSearch(near.id);
 else if(near.kind==='note')openDialogue('CABIN '+room.n,window.CampRooms.notes[room.n]);
 else if(near.kind==='bus')openDialogue('THE MINIBUS',['Keys in the ignition. The driver is gone.','Find the three phones. Get to this door and you will leave automatically.']);
 else if(near.kind==='sign')openDialogue('THE CAMP RULES',['Be present. Be kind. Surrender your phone.','No wandering after lights out. Trust the process.']);
 else if(near.kind==='pile')openDialogue('THE FIRE',['Blackened glass. Melted cases. A tiny blue light still blinking.']);
 else if(near.kind==='npc')openDialogue(near.name,near.lines);
 else if(near.kind==='bush'||near.kind==='bunk')hide('Keep still. Torch off. E / ACT to leave.');
}
function hide(message){cancelSearch();if(pursuit){say('They saw you. Run for the minibus.',3);return;}hidden=true;torch=false;$('hide-note').classList.remove('hidden');say(message,4);updateHUD();}
function toggleTorch(){if(state!=='play'||paused)return;if(!hasTorch){say('You don’t have a torch.',2);return;}torch=!torch;soundFX('torch');if(hidden&&torch)say('The light gives you away. Turn it off.',3);updateHUD();}
function blocked(x,y){
 if(x<28||x>MAP_W-28||y<30||y>MAP_H-35)return true;
 if(blockers.some(b=>x>b.x-5&&x<b.x+b.w+5&&y>b.y-3&&y<b.y+b.h+4))return true;
 return trees.some(t=>Math.hypot(x-t.x,y-t.y)<7);
}
function moveBody(body,dx,dy){const collision=body===player&&room?window.CampRooms.blocked:blocked;if(!collision(body.x+dx,body.y))body.x+=dx;if(!collision(body.x,body.y+dy))body.y+=dy;}
function caught(){state='caught';caughtTime=0;outcome='caught';cancelSearch();hidden=false;torch=false;keys={};resetStick();ui.touch.classList.add('hidden');ui.hud.classList.add('hidden');$('hide-note').classList.add('hidden');say('No last chance. No signal. No way out.',3);flash=.65;soundFX('caught');}
// A single roll-call ambush after the second phone. It uses the same fair
// hunter rules, starts behind the player and cannot attack during its reveal.
function startEncounter(){
 if(encounterDone||room||collectedCount()!==2||state!=='play')return false;
 const angle=Math.atan2(busDoor.y-player.y,busDoor.x-player.x)+Math.PI+(eventRandom()-.5)*.8;
 const desired={x:player.x+Math.cos(angle)*145,y:player.y+Math.sin(angle)*145};let spot=null,score=Infinity;
 for(let n=0;n<nav.length;n++){if(!nav[n])continue;const q={x:(n%NAV_W)*NAV_STEP+5,y:Math.floor(n/NAV_W)*NAV_STEP+5},d=dist(q,player);if(d<125||d>170)continue;const cost=dist(q,desired);if(cost<score&&lineOfSight(q,player)&&planRoute(q,player).length){score=cost;spot=q;}}
 if(!spot){const route=planRoute(player,busDoor);spot=route.find(q=>dist(q,player)>125);}
 if(!spot)return false;
 encounterDone=true;const home={...spot},target={x:player.x,y:player.y};
 enemies.push({...spot,home,patrol:[home,{x:303,y:937},{x:586,y:779}],color:'#785e4c',mode:'chase',last:target,time:0,active:true,wake:2,route:[],replan:0,waypoint:0,face:spot.y<player.y?'down':'up',encounter:true});
 grace=Math.max(grace,4);stamina=6;nextEvent=gameTime+18;flash=.4;
 say('The speaker crackles: “Roll call. One camper is missing.”\nA figure steps onto the trail behind you.',6);soundFX('notification',.55);hiss(.6,.035,700);soundFX('chase',.65);return true;
}
function startPursuit(){
 if(collectedCount()!==3)return false;pursuit=true;pursuitTime=0;hidden=false;torch=false;stamina=10;sprintLocked=false;grace=5;eventGhost=null;
 const origin=worldPlayer(),lastPhone=room?null:phones.find(p=>p.place==='outside'&&dist(player,p)<45),route=planRoute(origin,busDoor),next=lastPhone?.id==='liam'?branches[3][1]:lastPhone?.id==='willow'?branches[2][1]:route[Math.min(12,route.length-1)]||busDoor,angle=Math.atan2(next.y-origin.y,next.x-origin.x)+Math.PI;
 const placed=[];enemies.forEach((e,i)=>{const radius=i?185:145,desired={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};let best=null,score=Infinity;
  for(let n=0;n<nav.length;n++){if(!nav[n])continue;const q={x:(n%NAV_W)*NAV_STEP+5,y:Math.floor(n/NAV_W)*NAV_STEP+5},d=dist(q,origin);if(d<115||d>240||((q.x-origin.x)*Math.cos(angle)+(q.y-origin.y)*Math.sin(angle))/d<.2||placed.some(p=>dist(q,p)<28))continue;const cost=dist(q,desired);if(cost<score){score=cost;best=q;}}
  if(best&&planRoute(best,origin).length){e.x=best.x;e.y=best.y;placed.push(best);}
  Object.assign(e,{active:true,wake:0,mode:'chase',last:{...origin},time:0,replan:0,route:[]});});
 $('hide-note').classList.add('hidden');say(room?'Three phones. Leave the cabin and RUN to the minibus.':'They’re coming. Hold RUN / Shift. Reach the minibus door.',5);soundFX('chase');updateHUD();return true;
}
function beginEscape(){
 if(room||collectedCount()!==3||state!=='play')return false;outcome='escaped';state='outro';outroTime=0;cancelSearch();keys={};resetStick();hidden=false;torch=false;player.phone=false;ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');$('hide-note').classList.add('hidden');say('You slam the door. Turn the key. Don’t look back.',4);soundFX('door');soundFX('engine');return true;
}
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
function finish(result='escaped'){
 outcome=result;state='end';runEndedAt=Date.now();ui.caption.textContent='';ui.end.classList.remove('hidden');ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');
 $('end-label').textContent='DOOM SCROLL';$('end-title').textContent=result==='escaped'?'YOU GOT OUT.':'CAUGHT.';
 $('end-text').textContent=result==='escaped'?`3 phones recovered.
But someone was watching.`:`${collectedCount()} / 3 phones recovered.
The camp keeps what it catches.`;
 $('wasted-time').textContent=formatTime(runSeconds());$('retry').focus();tone(110,1.5,.03,'triangle');
}
function togglePause(){if(['menu','end','phone','outro','cctv','caught'].includes(state))return;paused=!paused;cancelSearch();ui.pause.classList.toggle('hidden',!paused);keys={};resetStick();$('pause').textContent=paused?'▶':'Ⅱ';if(paused)$('resume').focus();else canvas.focus();}
function randomEvent(){
 const n=Math.floor(eventRandom()*5);
 if(n===0){say('A phone rings in your pocket. There is no signal.',5);soundFX('notification',.6);}
 if(n===1){say('Something moves between the trees. Then it stops.',5);eventGhost={x:clamp(player.x+(eventRandom()>.5?95:-95),35,MAP_W-35),y:clamp(player.y-92,45,MAP_H-45),ttl:4};hiss(.55,.025,450);}
 if(n===2){say('A voice in the woods: “Your friends are waiting.”',5);tone(72,1.1,.025,'triangle');}
 if(n===3){say('The camp speaker crackles. “Thank you for being present.”',5);hiss(.4,.03,1700);flash=.3;}
 if(n===4){say('Footsteps behind you. They stop when you stop.',4);soundFX('twig',.55,.7);}
 nextEvent=gameTime+22+eventRandom()*15;
}
function update(dt){
 window.CampAudio?.update(dt,paused?'quiet':state==='play'&&(pursuit||enemies.some(e=>e.mode==='chase'))?'chase':state==='phone'?'phone':['cctv','end'].includes(state)?'cctv':'quiet',paused);
 transition+=dt;flash=Math.max(0,flash-dt);if(paused||state==='phone')return;
 if(subtitleTimer>0){subtitleTimer-=dt;if(subtitleTimer<=0)ui.caption.textContent='';}
 if(state==='outro'){outroTime+=dt;for(const e of enemies)if(e.active)steerEnemy({x:270,y:1135},dt,e);camera.x=lerp(camera.x,0,Math.min(1,dt*3));camera.y=lerp(camera.y,MAP_H-H,Math.min(1,dt*3));if(outroTime>6){state='cctv';outroTime=0;ui.caption.textContent='';soundFX('static');}return;}
 if(state==='cctv'){outroTime+=dt;if(outroTime>8)finish();return;}
 if(state==='caught'){caughtTime+=dt;if(caughtTime>2)finish('caught');return;}
 if(state==='intro'){
  introTime+=dt;ui.caption.textContent=introTime<2?'':introTime<5?'DISCONNECT.':introTime<8?'RECONNECT.':introTime<11?'BE PRESENT. BE FREE.':introTime<14?'[ A notification chimes from the fire. ]':introTime<18?'[ Bus brakes hiss. The chanting stops. ]':introTime<23?'“Welcome to camp.”':'';
  if(introTime<14){camera.x=fire.x-W/2;camera.y=clamp(fire.y-H*.49,0,MAP_H-H);const p=Math.floor(introTime/3);if(p!==lastPop){lastPop=p;hiss(.22,.07,2400);tone(70,1.6,.025,'triangle');tone(106,1.5,.012,'sine');}if(introTime>11&&introTime<11+dt){tone(880,.2,.045);tone(1174,.3,.03);}}
  else{const k=clamp((introTime-14)/5,0,1);camera.x=lerp(fire.x-W/2,40,k);camera.y=lerp(clamp(fire.y-H*.49,0,MAP_H-H),MAP_H-H,k);if(introTime<17&&introTime>17-dt){hiss(.9,.08,500);tone(55,1,.05,'sawtooth');}}
  if(introTime>=27)enterPlay();
 }
 if(state==='menu'){camera.x=fire.x-W/2;camera.y=clamp(fire.y-H*.47,0,MAP_H-H);}
 if(state==='play')updatePlay(dt);
 if(soundEnabled&&state!=='end'&&state!=='dialogue'&&transition-lastCrackle>.4){lastCrackle=transition;if(state==='intro'||state==='menu'||dist(player,fire)<160)soundFX('fire',.14);}
}
function updatePlay(dt){
 gameTime+=dt;if(pursuit)pursuitTime+=dt;grace=Math.max(0,grace-dt);if(eventGhost){eventGhost.ttl-=dt;if(eventGhost.ttl<=0)eventGhost=null;}
 let dx=move.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=move.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0),length=Math.hypot(dx,dy);
 if(length>1){dx/=length;dy/=length;}if(hidden){dx=0;dy=0;}
 if(stamina<=.05)sprintLocked=true;if(stamina>1.4||!keys.Shift)sprintLocked=false;sprinting=!!(keys.Shift&&!sprintLocked&&stamina>.05&&(dx||dy));stamina=pursuit?10:clamp(stamina+(sprinting?-dt:dt*.8),0,6);
 const speed=sprinting?98:64;moveBody(player,dx*speed*dt,dy*speed*dt);
 if(dx||dy){player.walk+=dt*8;player.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';if(gameTime-lastStep>(sprinting?.23:.4)){lastStep=gameTime;soundFX('step',sprinting?.9:.6,Math.sin(player.walk)*.13);}}
 if(!room){camera.x=lerp(camera.x,clamp(player.x-W/2,0,MAP_W-W),Math.min(1,dt*7));camera.y=lerp(camera.y,clamp(player.y-H*.57,0,MAP_H-H),Math.min(1,dt*7));}
 // Boarding takes priority at the door; no button press or last-frame catch.
 if(!room&&collectedCount()===3&&dist(player,busDoor)<29){beginEscape();return;}
 near=findNearby();$('nearby').textContent=near?near.label:'';updateHUD();
 if(!room&&!pursuit&&gameTime>=nextEvent&&hasTorch&&!hidden)randomEvent();
 const danger=window.CampHunt.update(enemies,dt,{player:worldPlayer(),count:collectedCount(),inside:!!room,hidden,torch,sprinting,grace,pursuit,pursuitTime,lineOfSight,moveEnemy:steerEnemy});
 if(danger.caught){caught();return;}
 $('danger').classList.toggle('hidden',!danger.threatened);$('danger').textContent=danger.threatened?(pursuit?'THEY’RE FOLLOWING · REACH THE BUS':'FOOTSTEPS · TORCH OFF / HIDE'):'';
 if(danger.threatened&&gameTime-lastEnemyStep>.45){lastEnemyStep=gameTime;const e=enemies.filter(e=>e.active).sort((a,b)=>dist(a,worldPlayer())-dist(b,worldPlayer()))[0];soundFX('step',clamp(1-dist(e,worldPlayer())/220,.1,.65),clamp((e.x-worldPlayer().x)/120,-.8,.8));}
 updateSearch(dt);
}
function returnFromPhone(){
 player.phone=false;state='play';ui.hud.classList.remove('hidden');ui.touch.classList.remove('hidden');canvas.focus();grace=Math.max(grace,4);
 const count=collectedCount();
 if(count===3&&!pursuit)startPursuit();
 else if(count===2&&!encounterDone&&!room)startEncounter();
 else say('Phone secured.',2);
 updateHUD();
}
function openPhone(id){
 const p=phones.find(p=>p.id===id);if(!p||!p.collected||state!=='play'||paused||pursuit)return false;
 cancelSearch();state='phone';keys={};resetStick();player.phone=true;ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');ui.caption.textContent='';soundFX('pickup');
 if(id==='martha')window.SugarSmush.open(returnFromPhone);else window.CampPhones.open(id,returnFromPhone);return true;
}
function pickupPhone(id='martha'){const p=phones.find(p=>p.id===id);if(!p||p.collected||state!=='play')return false;p.collected=true;updateHUD();openPhone(id);return true;}
window.gameSound=(kind,combo=1)=>{if(kind==='smush'){tone(440+combo*110,.16,.025,'triangle');tone(660+combo*110,.22,.02);}else tone(160,.15,.012,'triangle',-60);};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(0,Math.round(w)),Math.max(0,Math.round(h)));}
function pixelText(s,x,y,c='#c8c8a5',size=7){ctx.font=`${size}px monospace`;ctx.fillStyle=c;ctx.fillText(s,Math.round(x),Math.round(y));}
function glow(x,y,r,c){const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function tree(t){
 const x=t.x,y=t.y,h=t.h;ctx.save();if(state==='play'&&!hidden&&Math.abs(player.x-x)<30&&player.y<y&&player.y>y-h)ctx.globalAlpha=.48;
 rect(x-18,y-2,40,6,'#081d1680');rect(x+5,y+3,24,4,'#071c154f');rect(x-3,y-h*.38,7,h*.38,'#574832');rect(x-2,y-16,2,12,'#876a42');rect(x+2,y-12,1,9,'#293729');
 if(t.type===0){for(let i=0;i<6;i++){const ww=13+i*6,yy=y-h+i*9;rect(x-ww/2,yy,ww,12,['#365439','#2d4933','#34513a'][t.tone]);rect(x-ww/2,yy+9,ww,3,'#1c392c');for(let j=2;j<ww-2;j+=7){rect(x-ww/2+j,yy+2,3,1,'#65714880');rect(x-ww/2+j+1,yy+5,1,2,'#162e25');}}}
 else{const blocks=[[-13,0,27,13],[-23,9,43,17],[-29,20,52,20],[-22,35,46,14],[-13,45,28,10]];for(let i=0;i<blocks.length;i++){const [xx,yy,ww,hh]=blocks[i];rect(x+xx,y-h+yy,ww,hh,['#3b5737','#315037','#284b32'][t.tone]);rect(x+xx+3,y-h+yy,ww*.45,3,'#536640');rect(x+xx,y-h+yy+hh-4,ww,4,'#203d2b');for(let j=0;j<ww;j+=7){rect(x+xx+j+2,y-h+yy+5+(j%3),2,2,'#66744970');rect(x+xx+j,y-h+yy+10,3,1,'#142e2370');}}}
 ctx.restore();
}
function cabin(c){
 const x=c.x,y=c.y,w=c.w,h=c.h,theme=window.CampRooms.themes[c.n];rect(x-7,y+h-4,w+21,11,'#10271b85');rect(x+5,y+h+7,w+13,5,'#0a20175e');rect(x,y+38,w,h-38,'#796246');rect(x+w-7,y+40,7,h-40,'#4d4b33');
 for(let yy=45;yy<h;yy+=6){rect(x+2,y+yy,w-6,1,'#454d32');rect(x+3,y+yy+1,w-10,1,'#a08155');for(let xx=8;xx<w-8;xx+=28){rect(x+xx,y+yy+3,9,1,'#67543a');rect(x+xx+17,y+yy,1,1,'#b3905c');}}
 rect(x-8,y+3,w+16,37,theme.roof);rect(x-2,y-4,w+4,9,'#586b48');rect(x+5,y-8,w-10,5,'#73805a');
 for(let row=0;row<5;row++)for(let xx=0;xx<w+10;xx+=11){const px=x-5+xx+(row%2?5:0),py=y+7+row*6;rect(px,py,9,4,row%2?theme.roof:'#435b40');rect(px,py+4,10,1,'#213d2d');rect(px+1,py,5,1,'#78825b50');}
 rect(x-9,y+38,w+18,5,'#21362a');rect(x-7,y+43,w+14,2,theme.trim);rect(x+w-27,y+5,11,12,'#676d56');rect(x+w-25,y+3,7,3,'#91927a');rect(x+w-24,y+2,5,1,'#c3b694');rect(x+w-23,y+7,2,6,'#424e3a');
 for(const wx of [x+13,x+w-34]){rect(wx-2,y+h-42,26,28,'#3e4530');rect(wx,y+h-40,22,23,c.n==='03'&&hasTorch?'#857044':'#c3a35e');rect(wx+1,y+h-39,7,20,'#dab87655');rect(wx+10,y+h-40,2,24,'#68573a');rect(wx,y+h-29,22,2,'#645333');rect(wx-3,y+h-15,28,3,'#b09362');rect(wx+3,y+h-42,1,4,'#ece0a173');}
 const door=x+w/2;rect(door-12,y+h-34,24,34,'#303f2d');rect(door-9,y+h-31,18,29,'#5d5037');rect(door-7,y+h-29,2,26,'#846b43');rect(door+5,y+h-16,2,2,'#e4c97c');rect(door-19,y+h+1,38,5,'#9b8d64');rect(door-22,y+h+6,44,4,'#6d6b47');for(let yy=1;yy<10;yy+=4)rect(door-20,y+h+yy,40,1,'#c0ad7980');
 rect(door-10,y+h-47,21,10,'#344833');pixelText(c.n,door-6,y+h-39,'#e2d3a0',8);
 rect(x+w-3,y+h-40,2,23,'#6c7251');rect(x+w-8,y+h-39,10,12,'#a8a262');rect(x+w-6,y+h-36,6,7,'#ebd389');rect(x+w-8,y+h-40,10,2,'#344b34');
 // Boots, bags and rain barrels add lived-in detail around the porches.
 rect(x+9,y+h+5,5,4,'#504b33');rect(x+17,y+h+5,5,4,'#504b33');rect(x+w+3,y+h-10,12,12,'#495c4a');rect(x+w+2,y+h-11,14,3,'#75816a');rect(x+w+3,y+h-5,12,1,'#283f31');
 if(c.n==='01'){
  // Neglected old bunkhouse: moss, crooked shutter and a hanging planter.
  for(let i=0;i<8;i++)rect(x+3+i*12,y+13+(i%3)*5,7,3,'#718054');
  rect(x+9,y+h-41,3,24,'#705e42');rect(x+8,y+h-26,5,2,'#a18d5a');
  rect(x+37,y+h-14,13,7,'#8b6344');for(let i=0;i<4;i++){rect(x+38+i*3,y+h-19,2,7,'#6e8855');rect(x+37+i*3,y+h-20,3,2,'#c2a674');}
 }else if(c.n==='02'){
  // Liam's damp jacket and enamel laundry sign.
  rect(x+38,y+h-29,10,16,'#506777');rect(x+35,y+h-26,4,9,'#81909a');rect(x+46,y+h-26,4,9,'#718692');
  rect(x+9,y+45,31,9,'#b0bba2');pixelText('WASH',x+11,y+52,'#3c5149',6);
  rect(x+2,y+7,14,1,'#1b302a');rect(x+5,y+8,2,5,'#84947d');
 }else if(c.n==='03'){
  // Martha has decorated the window with tiny candy-coloured stickers.
  for(let i=0;i<4;i++)rect(x+16+i*4,y+h-35+(i%2)*7,2,3,['#d498b2','#d6c681','#a8b6ca','#bcc78f'][i]);
  rect(x+w-34,y+h-40,3,23,'#a08a83');rect(x+w-16,y+h-40,3,23,'#a08a83');
  rect(x+7,y+10,20,2,'#aea173');rect(x+8,y+12,9,1,'#1c3229');
 }else{
  // Willow's purple curtains, cracked panes and discarded tripod.
  for(const wx of [x+13,x+w-34]){rect(wx+1,y+h-39,4,21,'#a48aab');rect(wx+17,y+h-39,4,21,'#786782');rect(wx+12,y+h-36,1,9,'#e0d6ae');rect(wx+8,y+h-27,5,1,'#e0d6ae');}
  rect(x+w-9,y+11,8,15,'#1b3029');rect(x+w-14,y+22,16,2,'#74765a');
  rect(x+36,y+h-18,2,17,'#849488');rect(x+31,y+h-17,12,2,'#b5baa1');rect(x+31,y+h-16,2,12,'#6f7d6a');rect(x+41,y+h-16,2,12,'#6f7d6a');
 }
 glow(x+w-3,y+h-33,49,'#e2ba4d26');if(c.n==='03'&&hidden)rect(x+18,y+h-34,7,16,'#50462c');
}
function person(x,y,color,walk=0,face='down',leader=false,holding=false){
 const step=Math.sin(walk*3)*2;rect(x-7,y-2,16,4,'#0b20158a');rect(x-4,y-7,4,6+step,'#303b2d');rect(x+2,y-7,4,6-step,'#26352a');rect(x-5,y-2+step,5,2,'#918464');rect(x+2,y-2-step,5,2,'#7c7357');
 rect(x-6,y-18,13,12,color);rect(x-5,y-17,2,8,'#dfdbb636');rect(x-8,y-17,3,8,'#b5a07b');rect(x+7,y-17,3,8,'#b5a07b');rect(x-8,y-10,3,2,'#dac09a');rect(x+7,y-10,3,2,'#dac09a');
 if(leader){rect(x-7,y-10,15,5,color);rect(x-6,y-19,13,2,'#d2c396');if(['menu','intro'].includes(state)&&Math.sin(transition*3)>0){rect(x-10,y-23,3,7,'#c4b48d');rect(x+8,y-23,3,7,'#c4b48d');}}
 rect(x-4,y-27,9,9,'#c8ae87');rect(x-5,y-29,10,5,'#493b31');rect(x-4,y-28,7,1,'#7d5c3e');if(face==='up'){rect(x-4,y-25,9,7,'#4c3e32');if(!leader){rect(x-4,y-17,9,8,'#736942');rect(x-3,y-16,7,1,'#b1a475');rect(x-3,y-10,7,2,'#595836');}}
 else if(face==='down'){rect(x-2,y-23,1,1,'#29342a');rect(x+3,y-23,1,1,'#29342a');rect(x,y-20,3,1,'#9c7c5a');if(!leader){rect(x-5,y-17,2,10,'#514938');rect(x+4,y-17,2,10,'#514938');rect(x-3,y-17,7,2,'#dac7a1');}}
 else if(face==='left'){rect(x-6,y-23,2,3,'#c8ae87');rect(x-3,y-23,1,1,'#25352b');}else{rect(x+5,y-23,2,3,'#c8ae87');rect(x+3,y-23,1,1,'#25352b');}
 if(holding){rect(x+7,y-19,5,9,'#7cbdb8');rect(x+8,y-18,3,5,'#afe9df');}
}
function firepit(){
 const x=fire.x,y=fire.y;rect(x-25,y-6,50,16,'#182c1e');for(let i=0;i<14;i++){const a=i*Math.PI*2/14,px=x+Math.cos(a)*23,py=y+Math.sin(a)*11;rect(px-4,py-3,8,6,i%3?'#7c7d60':'#9b9670');rect(px-2,py-3,4,1,'#bbb18a');}
 rect(x-18,y-8,36,10,'#6d4a2d');rect(x-14,y-4,31,4,'#9f6737');rect(x-8,y-10,5,12,'#ba7240');
 for(let i=0;i<9;i++){const h=18+Math.sin(transition*7+i*2)*8;rect(x-17+i*4,y-h,6,h,'#c96032');rect(x-12+i*3,y-h*.7,4,h*.7,'#f4a44c');}rect(x-7,y-9,14,8,'#f9d77f');
 for(let i=0;i<16;i++){const k=(transition*(14+i)+i*9)%70;rect(x+Math.sin(i*5+k/8)*18,y-12-k,1,2,i%2?'#eecb80':'#df8141');}
 for(let i=0;i<4;i++){const k=(transition*8+i*14)%66;rect(x-7+Math.sin(k/20)*8,y-25-k,15+k*.2,3,'#a5a28912');}
 rect(x+36,y-4,24,9,'#314037');rect(x+38,y+5,23,2,'#152b22');for(let i=0;i<4;i++){rect(x+40+i*4,y-7-(i%2)*2,4,7,'#697564');rect(x+40+i*4,y-6-(i%2)*2,2,3,i===2?'#91c2bc':'#a2967d');}
 rect(x-50,y+3,13,11,'#52615b');rect(x-52,y+1,17,3,'#859283');rect(x-48,y+6,9,2,'#354b41');glow(x,y-13,108,'#f0aa443e');
}
function centeredPixelText(text,x,y,color,size=7){ctx.font=`${size}px monospace`;pixelText(text,x-ctx.measureText(text).width/2,y,color,size);}
function bus(x,y,facing='left'){const worldX=x,worldY=y;ctx.save();if(facing==='left'){ctx.translate(x+162,y);ctx.scale(-1,1);x=0;y=0;}
 // A compact minibus body with a distinct cab, windscreen and stepped nose.
 rect(x-7,y+29,174,9,'#0b201b9c');rect(x+1,y-21,128,50,'#b2ab7a');rect(x+6,y-26,121,6,'#d4c799');rect(x+11,y-28,107,3,'#e7d7a6');rect(x+9,y-24,113,1,'#908862');
 rect(x+126,y-22,15,45,'#a6a270');rect(x+139,y-18,8,42,'#c2b88a');rect(x+146,y-10,7,34,'#aca87a');rect(x+150,y+7,10,20,'#bdb485');rect(x+157,y+15,5,11,'#d0c193');
 for(let i=0;i<5;i++){const xx=x+8+i*20;rect(xx,y-17,17,24,'#223c36');rect(xx+2,y-15,13,4,'#78978a');rect(xx+2,y-10,2,13,'#467769');rect(xx+14,y-12,1,14,'#0f2e29');if(i%2===0){rect(xx+9,y-2,4,6,'#a5a881');rect(xx+7,y+3,7,3,'#778666');}}
 // Driver glass slopes into the nose instead of the old dark front rectangle.
 rect(x+113,y-18,18,23,'#29473e');rect(x+131,y-15,10,22,'#29473e');rect(x+140,y-9,5,18,'#29473e');rect(x+115,y-16,14,3,'#90aca0');rect(x+133,y-12,6,3,'#799a8b');rect(x+129,y-17,2,23,'#d1c797');rect(x+142,y-6,2,13,'#849d86');
 rect(x+121,y-4,5,6,'#b9b18a');rect(x+118,y+2,9,4,'#687c5e');rect(x+135,y+1,8,2,'#122f28');rect(x+144,y-6,9,3,'#7f9275');rect(x+151,y-7,3,6,'#233a30');
 rect(x+3,y+9,146,4,'#5a7855');rect(x+4,y+13,141,2,'#94a376');rect(x+2,y+27,151,3,'#6a7751');
 // Passenger door is integrated into the body; the cab retains its front wheel.
 rect(x+104,y+7,2,21,'#747953');rect(x+118,y+8,1,20,'#7b8058');rect(x+107,y+17,7,1,'#dad29f');rect(x+105,y+28,14,3,'#d1c297');
 rect(x+152,y+13,7,5,'#f3df9d');rect(x+155,y+19,6,2,'#5a6550');rect(x+150,y+26,13,4,'#55634e');rect(x-2,y+14,4,6,'#bd6f43');rect(x,y+24,6,4,'#56654c');
 for(const xx of [20,126]){rect(x+xx-2,y+26,20,11,'#11251b');rect(x+xx+1,y+28,14,8,'#334235');rect(x+xx+5,y+30,6,4,'#92987b');rect(x+xx+6,y+31,3,2,'#c0bb8e');}

 if((state==='intro'&&introTime>14&&introTime<20)||state==='outro')glow(x+162,y+16,90,'#ecd59528');
 ctx.restore();centeredPixelText('CAMP LLANLLWLI',worldX+(facing==='left'?106:56),worldY+23,'#f1e5ba',7);
}
function sign(){const p=positions.sign;rect(p.x-3,p.y-50,6,51,'#726347');rect(p.x-1,p.y-48,2,46,'#a08758');rect(p.x-47,p.y-67,95,29,'#7b6f49');rect(p.x-44,p.y-64,89,23,'#b4a776');rect(p.x-43,p.y-63,86,1,'#d0c293');centeredPixelText('DISCONNECT.',p.x,p.y-55,'#344631',7);centeredPixelText('BE FREE.',p.x,p.y-46,'#344631',7);rect(p.x-4,p.y-1,9,3,'#334332');}
function welcomeArch(){const {x,y,w,h}=gateway;
 for(const px of [x-w/2,x+w/2-4]){rect(px,y-h,5,h,'#736847');rect(px+1,y-h+2,1,h-5,'#ab9262');rect(px-2,y-2,9,4,'#334831');}
 rect(x-w/2-6,y-h-4,w+16,23,'#827754');rect(x-w/2-4,y-h-3,w+12,19,'#b8ae7b');rect(x-w/2-2,y-h-2,w+8,1,'#d4c79a');centeredPixelText('WELCOME',x,y-h+10,'#3c5235',9);
 for(let i=0;i<7;i++)rect(x-w/2+3+i*(w-8)/6,y-h-6,2,2,'#efcd87');
}
function pursuer(e,walk=0){
 const {x,y,face,color}=e;person(x,y,color,walk,face,true);rect(x-6,y-28,13,11,'#14271f');rect(x-5,y-29,10,2,'#3e5140');rect(x-6,y-27,2,8,'#3d4b38');rect(x+5,y-26,2,9,'#081c16');rect(x-5,y-17,2,9,'#748164');rect(x-3,y-8,8,2,'#263a2d');
 if(face==='down'){rect(x-3,y-25,7,5,'#091913');rect(x-2,y-24,1,1,'#bcac82');rect(x+3,y-24,1,1,'#bcac82');}
 else if(face==='left'||face==='right'){const side=face==='left'?-4:4;rect(x+side,y-25,2,5,'#091913');rect(x+side,y-24,1,1,'#bcac82');}
}
function bush(b){rect(b.x-23,b.y-11,47,15,'#2c4930');rect(b.x-14,b.y-21,29,13,'#49603b');rect(b.x-9,b.y-25,19,7,'#637448');for(let i=0;i<8;i++){rect(b.x-19+i*5,b.y-10-(i%3)*4,2,2,'#83905b');rect(b.x-17+i*5,b.y-7-(i%2)*4,2,1,'#263e27');}rect(b.x-24,b.y+1,50,3,'#1b3523');}
function lantern(x,y){rect(x,y-34,3,35,'#696647');rect(x-5,y-38,12,12,'#b4a66b');rect(x-3,y-36,8,7,'#f4d78c');rect(x-5,y-39,12,2,'#3d5235');glow(x,y-32,57,'#e1b7532c');}
function bench(x,y){rect(x-29,y-12,61,19,'#0e271b80');rect(x-25,y-16,54,11,'#977b4e');for(let i=0;i<3;i++)rect(x-24,y-15+i*3,52,1,'#c1a16b');rect(x-28,y-2,60,5,'#b39259');rect(x-22,y+3,4,8,'#515239');rect(x+22,y+3,4,8,'#515239');rect(x-18,y-11,4,5,'#e5d29e');rect(x-17,y-10,2,2,'#8e7050');rect(x+7,y-13,5,3,'#c7854c');}
function laundryLine(){
 for(const x of [264,361]){rect(x,628,3,37,'#6c7050');rect(x+1,629,1,32,'#aa9767');rect(x-2,664,7,2,'#31432c');}rect(265,628,96,1,'#c7bf8d');for(let i=0;i<4;i++){const x=276+i*20,h=20+(i%2)*4;rect(x,629,14,h,['#879f8e','#bdad78','#849fa0','#a48267'][i]);rect(x+2,630,2,h-2,'#dfd7aa50');rect(x+10,631,2,h-3,'#152d2635');rect(x+4,626,2,5,'#d8c398');rect(x+10,627,2,3,'#927652');rect(x,629+h-2,14,1,'#d3ca9f60');}
}
function supplyBin(){rect(440,972,33,27,'#48563c');rect(437,970,39,5,'#73805b');rect(442,977,2,18,'#90a27350');rect(439,999,35,2,'#21382a');pixelText('BIN',448,986,'#bdc49e',7);}
function campBag(){rect(284,975,10,13,'#806b42');rect(284,976,10,2,'#b9a26a');rect(294,984,7,5,'#91846a');rect(286,979,6,5,'#a38b5c');rect(288,973,4,2,'#4b543d');}
function phoneOnGround(p){const pulse=(Math.sin(transition*3)+1)/2;glow(p.x,p.y-4,38+pulse*10,p.id==='liam'?'#7fb7ee66':p.id==='willow'?'#c496ed66':'#84d7d246');rect(p.x-5,p.y-12,10,15,'#263e3b');rect(p.x-4,p.y-11,8,12,p.color||'#92d7d2');rect(p.x-2,p.y-11,4,1,'#38574f');for(let i=0;i<6;i++)rect(p.x-3+(i%2)*3,p.y-8+Math.floor(i/2)*3,2,2,['#ed97c0','#e4c766','#a9cf8d'][i%3]);rect(p.x-1,p.y+1,2,1,'#dbf4e5');}
// Final shot: a person inside the camp watches the exit camera. The monitor
// shows the minibus depart; this view stays behind the Instagram end card.
function drawCCTV(){
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);rect(0,0,W,H,'#081312');
 const sy=Math.round(H*.20),sx=34,sw=292,sh=Math.round(Math.min(H*.34,218));
 // Wall panels and bundles of security cables, lit by the screen.
 for(let x=0;x<W;x+=35){rect(x,0,1,H,'#182824');rect(x+4,0,1,H,'#0c1d18');}
 rect(21,sy-20,318,sh+47,'#101e1c');rect(26,sy-15,310,sh+40,'#3b4940');rect(30,sy-11,303,sh+31,'#64705b');rect(sx,sy,sw,sh,'#203d32');
 ctx.save();ctx.beginPath();ctx.rect(sx,sy,sw,sh);ctx.clip();
 rect(sx,sy,sw,sh,'#253d32');for(let i=0;i<90;i++){const x=sx+(i*43)%sw,y=sy+(i*29)%sh;rect(x,y,3,1,'#57705845');}
 // Overhead exit road, fence and a reduced version of the actual minibus.
 rect(sx,sy+sh*.52,sw,43,'#57654d');rect(sx,sy+sh*.58,sw,1,'#a4b09160');
 for(let x=sx;x<sx+sw;x+=20){rect(x,sy+sh*.35,3,21,'#9aa47c');rect(x,sy+sh*.36,20,2,'#768b63');}
 for(let i=0;i<9;i++){const x=sx+13+i*34,y=sy+sh*.3;rect(x-10,y-17,22,21,'#163326');rect(x-6,y-24,12,15,'#375b39');rect(x-1,y+2,3,8,'#657055');}
 const k=clamp((outroTime-.7)/5.5,0,1),bx=lerp(sx+sw-68,sx-130,k),by=sy+sh*.58;
 ctx.save();ctx.translate(bx,by);ctx.scale(.57,.57);bus(0,0,'left');ctx.restore();for(let i=0;i<2;i++){const px=sx+sw-50-i*20-Math.min(outroTime,3)*9,py=sy+sh*.44+i*7;ctx.save();ctx.translate(px,py);ctx.scale(.47,.47);pursuer({x:0,y:0,color:'#18332a',face:'left'},outroTime*10);ctx.restore();}
 for(let y=sy;y<sy+sh;y+=3)rect(sx,y,sw,1,'#08190f60');if(!reduced){const y=sy+(transition*30)%sh;rect(sx,y,sw,2,'#b6c79316');}
 pixelText('CAM 04 / CAMP EXIT',sx+8,sy+13,'#c4d3a1',9);rect(sx+sw-41,sy+8,4,4,'#d9946a');pixelText('REC',sx+sw-32,sy+13,'#dbc5a0',8);pixelText('22:19:'+String(Math.floor(outroTime+14)%60).padStart(2,'0'),sx+8,sy+sh-9,'#bfcc9d',8);
 ctx.restore();rect(sx+sw-12,sy+sh+8,4,3,'#beaa6a');pixelText('SECURITY / LIVE',sx+7,sy+sh+12,'#859a81',7);
 // Desk, CRT stand, keyboard, mug, radio and the seated observer's silhouette.
 rect(155,sy+sh+23,49,16,'#273b30');rect(133,sy+sh+37,95,6,'#3c4a38');
 const desk=sy+sh+65;rect(0,desk,360,H-desk,'#202b24');rect(0,desk,360,6,'#53604a');rect(40,desk-10,169,12,'#485344');for(let i=0;i<17;i++)rect(44+i*9,desk-7,6,2,'#81896c');rect(264,desk-37,24,31,'#737c61');rect(263,desk-39,27,4,'#9b9e7a');rect(287,desk-30,8,15,'#63715b');rect(289,desk-27,3,9,'#1a2b23');
 rect(9,desk-33,37,25,'#3b4940');rect(14,desk-27,18,8,'#72836b');rect(14,desk-22,18,1,'#b2b18c');rect(40,desk-58,2,25,'#667d67');
 // A tiny phone lies face-down by the observer. Whose is it?
 rect(307,desk-11,18,10,'#70836d');rect(310,desk-10,4,2,'#1c3227');
 const headY=desk+22;rect(183,headY-47,55,56,'#071411');rect(193,headY-57,39,12,'#071411');rect(174,headY-30,68,24,'#071411');rect(183,headY-46,3,33,'#45624b');rect(197,headY+4,26,19,'#091915');
 rect(156,headY+18,116,57,'#0a1714');rect(143,headY+38,144,H-headY,'#081512');rect(154,headY+23,5,55,'#304636');rect(256,headY+26,4,49,'#1e3629');
 rect(113,desk+6,44,17,'#192c22');rect(94,desk-3,29,15,'#778068');rect(97,desk-5,19,3,'#939a79');rect(96,desk+6,26,2,'#3d5740');
 glow(W/2,sy+sh*.5,230,'#95be8220');
 if(state==='cctv'&&outroTime>5.7)pixelText('YOU LEFT. THEY SAW.',W/2-72,sy-37,'#d7d4ac',9);
}
function draw(){
 if(state==='cctv'||state==='end'&&outcome==='escaped'){drawCCTV();return;}
 if(room){window.CampRooms.draw(ctx,H,room,player,{hidden,hasTorch,marthaCollected:phones[0].collected,person,phone:phoneOnGround,glow});return;}
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(-Math.floor(camera.x),-Math.floor(camera.y));ctx.drawImage(terrain,0,0);
 // Pond edge, reeds and reflected moonlight.
 rect(636,793,84,145,'#223f3a');rect(628,812,8,109,'#3d5137');for(let i=0;i<16;i++){const y=803+i*8;rect(644+(i%4)*7+Math.sin(transition+i)*2,y,16,1,'#5e796244');if(i%3===0){rect(632+(i%2)*5,y,2,8,'#6b7950');rect(631+(i%2)*5,y-1,3,3,'#969465');}}
 for(let x=40;x<680;x+=20){rect(x,1222,4,24,'#657052');rect(x,1227,20,3,'#586344');rect(x,1238,20,2,'#364d36');}
 // Clear sight lines: small props share the same ground-contact depth as actors.
 const bx=state==='intro'?lerp(MAP_W+15,137,clamp((introTime-14)/5,0,1)):state==='outro'?lerp(137,-185,clamp((outroTime-1)/4,0,1)):137;
 const entities=[{y:gateway.y,draw:welcomeArch},{y:positions.sign.y,draw:sign},{y:1160,draw:()=>bus(bx,1160)},{y:665,draw:laundryLine},{y:999,draw:supplyBin},{y:988,draw:campBag},{y:551,draw:()=>bench(340,540)},{y:1000,draw:()=>lantern(379,1000)},{y:799,draw:()=>lantern(539,799)},{y:569,draw:()=>lantern(553,569)}];
 trees.forEach(t=>{if(t.x>camera.x-40&&t.x<camera.x+W+40&&t.y>camera.y-10&&t.y<camera.y+H+90)entities.push({y:t.y,draw:()=>tree(t)});});rocks.forEach(r=>entities.push({y:r.y,draw:()=>{rect(r.x-7,r.y-5,15,8,'#5a6650');rect(r.x-4,r.y-8,9,4,'#8a8e6d');rect(r.x+3,r.y-3,5,3,'#334a35');}}));cabins.forEach(c=>entities.push({y:c.y+c.h,draw:()=>cabin(c)}));bushes.forEach(b=>entities.push({y:b.y,draw:()=>bush(b)}));entities.push({y:fire.y,draw:firepit});
 if(state==='menu'||state==='intro'){
  [0,1,2,3,4].forEach(i=>{const a=i*Math.PI*2/5,x=fire.x+Math.cos(a)*52,y=fire.y+Math.sin(a)*33;entities.push({y,draw:()=>{person(x,y,['#b1aa7b','#98a17c','#beb382','#929c78','#a0a980'][i],0,y>fire.y?'up':'down',true);if(i===0&&(state==='menu'||introTime<14)){const t=(state==='menu'?transition:introTime)%3;if(t<1.2){const k=t/1.2;rect(lerp(x,fire.x,k),lerp(y-20,fire.y-8,k)-Math.sin(k*Math.PI)*27,4,7,'#addcd2');}}}});});
 }else{npcs.forEach(n=>entities.push({y:n.y,draw:()=>person(n.x,n.y,n.c,0,'down',n.name==='CAMP LEADER')}));if(!hidden&&state!=='outro')entities.push({y:player.y,draw:()=>person(player.x,player.y,'#c08458',player.walk,player.face,false,player.phone)});enemies.filter(e=>e.active).forEach(e=>entities.push({y:e.y,draw:()=>{pursuer(e,transition*4);}}));if(eventGhost)entities.push({y:eventGhost.y,draw:()=>person(eventGhost.x,eventGhost.y,'#2c382e',0,'down',true)});}
 if(state==='intro'&&introTime>19)for(let i=0;i<5;i++){const k=clamp((introTime-19-i*.85)/5,0,1);if(k>0){const x=lerp(271,287+i*14,k),y=lerp(1193,1040+i*11,k);entities.push({y,draw:()=>person(x,y,['#a4946c','#829c8c','#bc916c','#929e73','#c08458'][i],k*14,'up')});}}
 phones.filter(p=>p.place==='outside'&&!p.collected).forEach(p=>entities.push({y:p.y,draw:()=>phoneOnGround(p)}));entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 if(torch&&hasTorch&&!['menu','intro','phone'].includes(state)){const a={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0}[player.face],px=player.x,py=player.y-13;ctx.save();ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,126,a-.53,a+.53);ctx.closePath();ctx.clip();glow(px,py,136,'#ece2b04b');ctx.restore();rect(px+Math.cos(a)*9,py+Math.sin(a)*9,3,3,'#f3df9d');}
 // Occasional fireflies; subtle movement is disabled for reduced-motion users.
 if(!reduced)specks.forEach(p=>{const a=(Math.sin(transition+p.s)+1)/2;if(a>.8)rect(p.x+Math.sin(transition*.3+p.s)*3,p.y,1,1,'#c2cc884f');});
 ctx.restore();
 const vignette=ctx.createRadialGradient(W/2,H*.5,W*.3,W/2,H*.5,H*.72);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#06170cb3');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 if(hidden&&state==='play'){ctx.fillStyle='#04140c65';ctx.fillRect(0,0,W,H);pixelText('WAIT. LISTEN. THEN MOVE.',W/2-80,H*.72-9,'#c9d1a5',8);}
 if(state==='caught'){rect(0,0,W,H,'#360c1580');pixelText('YOUR LAST NOTIFICATION.',W/2-114,H*.48,'#ecd6c1',9);}
 if(state==='intro'){rect(0,0,W,15,'#08110c');rect(0,H-15,W,15,'#08110c');if(introTime<2){ctx.fillStyle=`rgba(0,0,0,${1-introTime/2})`;ctx.fillRect(0,0,W,H);}if(introTime>25){ctx.fillStyle=`rgba(0,0,0,${Math.sin(clamp((introTime-25)/2,0,1)*Math.PI)})`;ctx.fillRect(0,0,W,H);}}
 if(flash>0&&!reduced){ctx.fillStyle=`rgba(220,146,67,${flash*.13})`;ctx.fillRect(0,0,W,H);}
}
let lastFrame=0;function frame(t){const dt=Math.min((t-lastFrame)/1000||0,.05);lastFrame=t;update(dt);draw();requestAnimationFrame(frame);}
function resetStick(){move={x:0,y:0};stickPointer=null;$('stick-knob').style.transform='translate(0,0)';}
function stickMove(e){if(e.pointerId!==stickPointer)return;const r=$('stick').getBoundingClientRect(),radius=r.width/2-20;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y);if(d>radius){x*=radius/d;y*=radius/d;}move={x:Math.abs(x)<3?0:x/radius,y:Math.abs(y)<3?0:y/radius};$('stick-knob').style.transform=`translate(${x}px,${y}px)`;}
$('stick').addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play'||paused)return;stickPointer=e.pointerId;$('stick').setPointerCapture(e.pointerId);stickMove(e);});$('stick').addEventListener('pointermove',stickMove);['pointerup','pointercancel','lostpointercapture'].forEach(t=>$('stick').addEventListener(t,resetStick));
function fitViewport(){const r=$('viewport').getBoundingClientRect();if(r.width>0&&r.height>0){H=clamp(Math.round(W*r.height/r.width),420,800);canvas.width=W;canvas.height=H;camera.x=clamp(camera.x,0,MAP_W-W);camera.y=clamp(camera.y,0,MAP_H-H);}}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitViewport).observe($('viewport'));window.addEventListener('resize',fitViewport);
phones.forEach(p=>$('inv-'+p.id).onclick=()=>openPhone(p.id));
$('run').addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play'&&!paused){keys.Shift=true;$('run').setPointerCapture(e.pointerId);}});['pointerup','pointercancel','lostpointercapture'].forEach(t=>$('run').addEventListener(t,()=>keys.Shift=false));
$('start').onclick=()=>start(true);$('skip').onclick=enterPlay;$('continue').onclick=advanceDialogue;$('action').onclick=interact;$('torch').onclick=toggleTorch;$('sound').onclick=()=>setSound(!soundEnabled);$('audio-opt').onchange=e=>setSound(e.target.checked);$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('retry').onclick=()=>start(false);$('replay-intro').onclick=()=>start(true);
$('full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else document.documentElement.requestFullscreen?.().catch(()=>say('Fullscreen is unavailable in this browser.',3));};document.querySelector('.wordmark').onclick=e=>{e.preventDefault();if(state!=='menu')togglePause();};
window.addEventListener('keydown',e=>{if(e.defaultPrevented||state==='phone')return;if(e.target.tagName==='INPUT'||e.target.tagName==='BUTTON'&&['Enter',' '].includes(e.key))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','e','f','Escape'].includes(k))e.preventDefault();if(e.repeat)return;if(k==='Escape'){togglePause();return;}if(k==='e'||k==='Enter'){interact();return;}if(k==='f'){toggleTorch();return;}keys[k]=true;});window.addEventListener('keyup',e=>{keys[e.key.length===1?e.key.toLowerCase():e.key]=false;});
window.addEventListener('blur',()=>{keys={};resetStick();if(['play','intro','dialogue'].includes(state)&&!paused)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};resetStick();if(['play','intro','dialogue'].includes(state)&&!paused)togglePause();}});
$('footer-hint').textContent=coarse?'PLAY IN PORTRAIT':'HEADPHONES RECOMMENDED';resetWorld();fitViewport();requestAnimationFrame(frame);
