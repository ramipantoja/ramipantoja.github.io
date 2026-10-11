'use strict';
const $=id=>document.getElementById(id);
const screen=$('screen'),feed=$('feed'),hand=$('hand'),pause=$('pause'),skip=$('skip'),replay=$('replay'),egg=$('egg');
const reels=Array.from(document.querySelectorAll('.reel'));
const finalScene=reels.length-1;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
// The exclusive retreat invitation opens the feed before the algorithm takes over.
const cues=[
 {at:3200,duration:610,lift:169},
 {at:5550,duration:520,lift:185},
 {at:7140,duration:420,lift:198},
 {at:9600,duration:470,lift:182},
 {at:11900,duration:520,lift:174},
 {at:13760,duration:500,lift:187},
 // Give OFFICE B*TCH two more seconds for its task loop before the final swipe.
 {at:17590,duration:610,lift:145}
];
const titleAt=cues[cues.length-1].at+cues[cues.length-1].duration;
const ghostAt=titleAt+3350,eggAt=titleAt+4250,hintAt=eggAt+2400,endAt=hintAt+1200;
let elapsed=0,last=null,frame=0,scene=-1,running=false,paused=false,landed=false;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>1-Math.pow(1-clamp(n),3);
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
for(let i=0;i<25;i++){const c=document.createElement('span');c.className='candy';$('candies').append(c);}
function setScene(n){
 if(scene===n)return;scene=n;
 reels.forEach((r,i)=>{r.classList.toggle('active',i===n);r.setAttribute('aria-hidden',i===finalScene&&landed?'false':'true');});
 $('likes').textContent=['618','84.2K','24.8K','1.2M','18.6K','9,741','8,142',''][n];
}
function land(){
 if(landed)return;landed=true;screen.classList.add('landed');$('feed-label').textContent='DOOM SCROLL';skip.hidden=true;pause.hidden=true;replay.hidden=false;reels[finalScene].setAttribute('aria-hidden','false');
 $('status').textContent='DOOM SCROLL. An upcoming film by Josie Charles and Nathan Miller.';
}
function readyEgg(hint=false){
 if(!screen.classList.contains('egg-ready')){$('status').textContent='A Celtic symbol has appeared. Activate it to reveal a secret from Camp Llanllwni.';}
 screen.classList.add('egg-ready');egg.disabled=false;
 if(hint)screen.classList.add('egg-hint');
}
function renderThumb(time){
 const finalCue=cues[cues.length-1];
 let x=2*Math.sin(time/730),y=12+3*Math.sin(time/550),rotation=-8,scale=1;
 let opacity=ease((time-360)/520),contact=0;
 if(time<900)y+=(1-ease((time-360)/520))*210;
 for(let i=0;i<cues.length;i++){
  const cue=cues[i],t=time-cue.at;
  if(t< -440||t>cue.duration+470)continue;
  if(t<0){const p=smooth((t+440)/440);y=12-18*p;x=-7*p;rotation=-8-5*p;scale=1-.023*p;contact=p*.13;}
  else if(t<cue.duration*.64){const p=ease(t/(cue.duration*.64));y=-6-cue.lift*p;x=-7-12*p;rotation=-13-3*p;scale=.977;contact=(1-p)*.14;}
  else{const p=smooth((t-cue.duration*.64)/(cue.duration*.36+470));y=-6-cue.lift+(cue.lift+18)*p;x=-19+21*p;rotation=-16+8*p;scale=.977+.023*p;}
 }
 // The final swipe ends differently: lift off the glass, hover with interest,
 // make one tentative approach, then withdraw before the symbol appears.
 if(time>finalCue.at+finalCue.duration*.64){
  const hold=finalCue.at+finalCue.duration*.64,t=time-hold;
  const base=-6-finalCue.lift;
  if(t<440){const p=smooth(t/440);y=base-25*p;x=-19+20*p;rotation=-16+11*p;scale=.977+.11*p;}
  else if(t<1450){const p=(t-440)/1010;y=base-25+Math.sin(p*Math.PI)*5;x=1+Math.sin(p*Math.PI)*4;rotation=-5+Math.sin(p*Math.PI)*2;scale=1.087;}
  else if(t<2020){const p=smooth((t-1450)/570);y=base-25+20*p;x=1-8*p;rotation=-5-5*p;scale=1.087-.045*p;}
  else if(t<2540){y=base-5+Math.sin(time/250)*1.2;x=-7;rotation=-10;scale=1.042;}
  else{const p=smooth((t-2540)/930);y=base-5+460*p;x=-7+83*p;rotation=-10+16*p;scale=1.042-.042*p;opacity=1-p;}
  contact=0;
 }
 hand.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
 hand.style.opacity=opacity.toFixed(3);$('touch-glow').style.opacity=contact.toFixed(3);
}
function render(time){
 let position=0,active=0;
 for(let i=0;i<cues.length;i++){const cue=cues[i];if(time>=cue.at){position=i+ease((time-cue.at)/cue.duration);active=i+1;}}
 setScene(active);feed.style.transform=`translateY(-${(position*100).toFixed(3)}%)`;renderThumb(time);
 $('progress').style.width=`${Math.min(100,time/titleAt*100)}%`;
 if(time>=titleAt)land();
 const ghost=clamp((time-ghostAt)/470);
 $('interruption').style.opacity=time>=ghostAt&&time<ghostAt+470?(Math.sin(ghost*Math.PI)*.26).toFixed(3):'0';
 if(time>=eggAt)readyEgg(time>=hintAt);
}
function step(now){
 if(!running)return;
 const dt=last===null?0:Math.min(now-last,80);last=now;
 if(!paused){elapsed+=dt;render(elapsed);if(elapsed>=endAt){running=false;return;}}
 frame=requestAnimationFrame(step);
}
function stop(){cancelAnimationFrame(frame);running=false;paused=false;screen.classList.remove('paused');$('interruption').style.opacity='0';}
function finish(){stop();setScene(finalScene);feed.style.transform=`translateY(-${finalScene*100}%)`;hand.style.opacity='0';$('touch-glow').style.opacity='0';land();readyEgg(true);}
function revealSecret(){
 stop();readyEgg(true);screen.classList.add('revealed');egg.setAttribute('aria-expanded','true');$('status').textContent="Can't wait? Camp Llanllwni is waiting. Enter Doom Scroll — Night One.";$('invite').focus({preventScroll:true});
}
function start(){
 stop();elapsed=0;last=null;scene=-1;landed=false;running=true;
 screen.classList.remove('landed','revealed','egg-ready','egg-hint');$('feed-label').textContent='Reels';hand.className='hand';hand.style.opacity='0';skip.hidden=false;pause.hidden=false;replay.hidden=true;egg.disabled=true;egg.setAttribute('aria-expanded','false');pause.textContent='Ⅱ';pause.setAttribute('aria-label','Pause intro');
 $('status').textContent='A fictional feed is playing. Skip intro to reveal the film.';render(0);
 if(reduced.matches){finish();return;}frame=requestAnimationFrame(step);
}
pause.addEventListener('click',()=>{paused=!paused;screen.classList.toggle('paused',paused);pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-label',paused?'Resume intro':'Pause intro');last=null;});
skip.addEventListener('click',()=>{finish();egg.focus({preventScroll:true});});
replay.addEventListener('click',()=>{start();(reduced.matches?egg:pause).focus({preventScroll:true});});
egg.addEventListener('click',revealSecret);
document.addEventListener('visibilitychange',()=>{last=null;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&running){finish();egg.focus({preventScroll:true});}});
reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
start();
