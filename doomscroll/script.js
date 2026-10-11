'use strict';
const $ = id => document.getElementById(id);
const screen = $('screen'), feed = $('feed'), egg = $('egg');
const reels = [...document.querySelectorAll('.reel')];
const finalScene = reels.length - 1;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const likes = ['1,482','24.8K','3,207','84.2K','618','1.2M','18.6K','9,741','8,142',''];
const comments = [
 [['jo_irl','I picked my phone up to read this.'],['ben_w','The irony is not lost on me.']],
 [['ben_w','I said one round. Two hours ago.'],['jo_irl','Level 247. Send help.']],
 [['ben_w','Another billionaire saving us from his own app.'],['martha.smush','Okay but the cabins look lovely.']],
 [['olivia_dreams','You look unreal babe ♡'],['martha.smush','Another little secret?']],
 [['martha.smush','Okay but this actually looks lovely.'],['liam_irl','How far from the nearest town?']],
 [['liam_irl','Mate.'],['ben_w','the dinosaur wasn’t even his biggest problem']],
 [['martha.smush','It is literally 3am.'],['olivia_dreams','Still here? ♡']],
 [['jo_irl','I refuse to look at mine.'],['liam_irl','That is a full working day.']],
 [['martha.smush','This is just my actual job.'],['ben_w','Why am I doing unpaid overtime?']],
 []
];
const liked = new Set();
let scene = -1, raf = 0, filmTimers = [], revealStarted = false, timerEpoch = 0;
let toastTimer, heartTimer, hiddenAt = false;
for (let i=0;i<25;i++) { const c=document.createElement('span'); c.className='candy'; $('candies').append(c); }
function clearReveal() {
 filmTimers.forEach(clearTimeout); filmTimers=[]; timerEpoch++; revealStarted=false;
 screen.classList.remove('egg-ghost','egg-ready','egg-hint');
 egg.setAttribute('aria-hidden','true'); egg.setAttribute('tabindex','-1');
}
function queueReveal() {
 if (revealStarted || scene!==finalScene || document.hidden) return;
 revealStarted=true;
 const epoch=timerEpoch;
 const later=(ms,fn)=>filmTimers.push(setTimeout(()=>{if(epoch===timerEpoch && scene===finalScene && !document.hidden) fn();},ms));
 if (!reduced.matches) {
  later(850,()=>screen.classList.add('egg-ghost'));
  later(1120,()=>screen.classList.remove('egg-ghost'));
 }
 later(reduced.matches?0:1450,()=>{
  screen.classList.add('egg-ready'); egg.setAttribute('aria-hidden','false'); egg.removeAttribute('tabindex');
  $('status').textContent="Can't wait? The Celtic symbol opens Night One.";
 });
 later(reduced.matches?0:2200,()=>screen.classList.add('egg-hint'));
}
function syncActions() {
 $('like').setAttribute('aria-pressed',String(liked.has(scene)));
 const raw=likes[scene]||'';
 $('likes').textContent=liked.has(scene)&&!raw.includes('K')&&!raw.includes('M')?Number(raw.replaceAll(',',''))+1:raw;
 $('comment-count').textContent=['24','126','156','312','18','2,014','84','72','193',''][scene];
}
function setScene(n) {
 if(n===scene)return;
 clearReveal(); scene=n;
 reels.forEach((r,i)=>{r.classList.toggle('active',i===n);r.setAttribute('aria-hidden',String(i!==n));if('inert' in r)r.inert=i!==n;});
 screen.classList.toggle('landed',n===finalScene);
 screen.classList.toggle('report-view',n===7);
 if(n!==7){screen.classList.remove('report-dismissed');$('report-dismiss').classList.remove('show');$('ignore-limit').disabled=false;}
 $('social').inert=n===7||n===finalScene;
 screen.classList.toggle('article-view',reels[n].classList.contains('press-reel'));
 
 
 $('swipe-hint').hidden=n!==0;
 syncActions();
 $('status').textContent=n===finalScene?'DOOM SCROLL. An upcoming film by Josie Charles and Nathan Miller.':`Reel ${n+1} of ${reels.length}.`;
}
function updateScroll() {
 raf=0;
 const height=feed.clientHeight||1;
 const n=Math.max(0,Math.min(finalScene,Math.round(feed.scrollTop/height)));
 setScene(n);
 if(n===finalScene && Math.abs(feed.scrollTop-finalScene*height)<5)queueReveal();
 else if(revealStarted)clearReveal();
}
function goTo(n) {
 n=Math.max(0,Math.min(finalScene,n));
 feed.scrollTo({top:n*feed.clientHeight,behavior:reduced.matches?'auto':'smooth'});
}
function toast(message) {
 clearTimeout(toastTimer); $('toast').textContent=message; $('toast').classList.add('show');
 toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1900);
}
feed.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(updateScroll);},{passive:true});
feed.addEventListener('scrollend',updateScroll);
window.addEventListener('resize',()=>{feed.scrollTop=Math.max(0,scene)*feed.clientHeight;updateScroll();});
$('brand').addEventListener('click',e=>{e.preventDefault();goTo(0);});


$('like').addEventListener('click',()=>{liked.has(scene)?liked.delete(scene):liked.add(scene);syncActions();});
$('more').addEventListener('click',()=>$('more-sheet').showModal());
$('close-more').addEventListener('click',()=>$('more-sheet').close());
$('more-sheet').addEventListener('click',e=>{if(e.target===$('more-sheet'))$('more-sheet').close();});
$('more-start').addEventListener('click',()=>{$('more-sheet').close();goTo(0);});
$('more-share').addEventListener('click',()=>{$('more-sheet').close();shareReel();});
feed.addEventListener('dblclick',e=>{
 if(scene===finalScene||e.target.closest('a,button'))return;
 liked.add(scene);syncActions();clearTimeout(heartTimer);$('double-heart').classList.add('show');
 heartTimer=setTimeout(()=>$('double-heart').classList.remove('show'),700);
});
$('comments').addEventListener('click',()=>{
 const list=$('comment-list');list.replaceChildren();
 for(const [name,copy] of comments[scene]) {
  const p=document.createElement('p'),b=document.createElement('b'),span=document.createElement('span');
  b.textContent=name;span.textContent=copy;p.append(b,span);list.append(p);
 }
 $('comments-sheet').showModal();
});
$('close-comments').addEventListener('click',()=>$('comments-sheet').close());
$('comments-sheet').addEventListener('click',e=>{if(e.target===$('comments-sheet'))$('comments-sheet').close();});
async function shareReel(){
 const url='https://raspfilms.com/doomscroll/';
 try {
  if(navigator.share)await navigator.share({title:'DOOM SCROLL',text:'The feed stops here.',url});
  else if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(url);toast('Link copied.');}
  else toast(url);
 }catch(e){if(e.name!=='AbortError')toast(url);}
}
$('share').addEventListener('click',shareReel);
$('ignore-limit').addEventListener('click',()=>{
 $('report-dismiss').classList.add('show');
 const button=$('ignore-limit');button.textContent='Done';button.disabled=true;
 screen.classList.add('report-dismissed');
});
document.addEventListener('keydown',e=>{
 if($('comments-sheet').open || $('more-sheet').open || e.target.closest('a,button,input,textarea,select'))return;
 if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' '){e.preventDefault();goTo(scene+1);}
 if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();goTo(scene-1);}
 if(e.key==='Home'){e.preventDefault();goTo(0);}
 if(e.key==='End'){e.preventDefault();goTo(finalScene);}
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){hiddenAt=true;clearReveal();}
 else if(hiddenAt){hiddenAt=false;updateScroll();}
});
reduced.addEventListener('change',()=>{clearReveal();updateScroll();});
// No automatic feed movement. Native scrolling owns touch, trackpad and mouse.
setScene(0);
updateScroll();
