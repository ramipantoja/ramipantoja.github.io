/* Sugar Smush: original match-three rules and vector sweets. No borrowed assets.
   The engine is independent of the DOM so swaps, cascades and rounds can be tested. */
(function(){
'use strict';
const N=6,TYPES=5,LIMIT=6;
const names=['pink jelly bean','blue diamond drop','orange wrapped sweet','green gumdrop','purple swirl'];
const shapes=[
'<path d="M13 39C3 26 17 10 31 13c18-2 22 18 10 28-12 12-19 8-28-2Z" fill="#ed5599" stroke="#b83373" stroke-width="2"/><path d="M14 27c1-7 8-12 15-10" fill="none" stroke="#ffc2df" stroke-width="5" stroke-linecap="round"/><path d="M19 43c8 4 15 1 20-6" fill="none" stroke="#d63a88" stroke-width="3"/>',
'<path d="m28 6 20 15-7 24H15L8 21Z" fill="#4dbce8" stroke="#2680bd" stroke-width="2"/><path d="m28 8 7 15-7 23-7-23Z" fill="#83dcf5"/><path d="m10 22 11 1-6 20m31-21-11 1 6 20" fill="none" stroke="#35a2d4" stroke-width="2"/><path d="m17 17 7-5" stroke="#e3faff" stroke-width="4" stroke-linecap="round"/>',
'<path d="m6 14 12 6-2 18-11 5 4-15Zm44 0-12 6 2 18 11 5-4-15Z" fill="#f29948" stroke="#ca7039" stroke-width="1.5"/><rect x="15" y="15" width="27" height="29" rx="8" fill="#ffa53d" stroke="#d37b29" stroke-width="2"/><path d="m21 16-2 25m11-26-4 29m12-27-3 24" stroke="#ffe899" stroke-width="5"/><path d="m21 21 5-3" stroke="#fffbd3" stroke-width="3" stroke-linecap="round"/>',
'<path d="M10 41C10 24 17 10 28 10s18 14 18 31c0 8-36 8-36 0Z" fill="#90ce61" stroke="#4a9347" stroke-width="2"/><path d="M17 29c1-7 4-12 8-14" fill="none" stroke="#dbf6a5" stroke-width="5" stroke-linecap="round"/><path d="M12 40c10 4 24 4 32 0" fill="none" stroke="#68b956" stroke-width="3"/><circle cx="28" cy="21" r="1.5" fill="#e5fab7"/><circle cx="36" cy="30" r="1.5" fill="#e5fab7"/>',
'<circle cx="28" cy="28" r="20" fill="#a879e6" stroke="#7543b5" stroke-width="2"/><path d="M28 13c-18 0-17 28 0 28 12 0 13-19 0-19-8 0-8 11 0 11" fill="none" stroke="#e9c8ff" stroke-width="5" stroke-linecap="round"/><path d="m15 16 5-3" stroke="#f4dfff" stroke-width="3" stroke-linecap="round"/>'
];
class Model{
 constructor(seed=2319){this.seed=seed;this.round=1;this.moves=LIMIT;this.score=0;this.roundScore=0;this.goal=1800;this.complete=false;this.roundOver=false;this.board=[];this.makeBoard();}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 matches(board=this.board){const out=new Set();for(let r=0;r<N;r++)for(let c=0;c<N;c++){const i=r*N+c,t=board[i];if(t<0)continue;if(c<=N-3&&board[i+1]===t&&board[i+2]===t){let k=c;while(k<N&&board[r*N+k]===t)out.add(r*N+k++);}if(r<=N-3&&board[i+N]===t&&board[i+2*N]===t){let k=r;while(k<N&&board[k*N+c]===t)out.add(k++*N+c);}}return [...out];}
 adjacent(a,b){return a>=0&&b>=0&&a<N*N&&b<N*N&&Math.abs(Math.floor(a/N)-Math.floor(b/N))+Math.abs(a%N-b%N)===1;}
 validSwap(a,b){if(!this.adjacent(a,b))return false;const copy=[...this.board];[copy[a],copy[b]]=[copy[b],copy[a]];return this.matches(copy).length>0;}
 legalMoves(){const out=[];for(let i=0;i<N*N;i++)for(const j of [i%N<N-1?i+1:-1,i<N*(N-1)?i+N:-1])if(j>=0&&this.validSwap(i,j))out.push([i,j]);return out;}
 makeBoard(){for(let attempt=0;attempt<120;attempt++){this.board=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const i=r*N+c;let choices=[];for(let t=0;t<TYPES;t++)if(!(c>1&&this.board[i-1]===t&&this.board[i-2]===t)&&!(r>1&&this.board[i-N]===t&&this.board[i-2*N]===t))choices.push(t);this.board[i]=choices[Math.floor(this.random()*choices.length)];}if(this.legalMoves().length)return;}
 this.board=Array.from({length:N*N},(_,i)=>(Math.floor(i/N)*2+i%N)%TYPES);this.board.splice(0,6,0,1,0,2,3,4);this.board[N+1]=0;
 }
 swap(a,b){if(this.moves<=0||this.roundOver||this.complete||!this.validSwap(a,b))return false;[this.board[a],this.board[b]]=[this.board[b],this.board[a]];this.moves--;return true;}
 collapse(indices){indices.forEach(i=>this.board[i]=-1);const fresh=[];for(let c=0;c<N;c++){const keep=[];for(let r=N-1;r>=0;r--)if(this.board[r*N+c]>=0)keep.push(this.board[r*N+c]);for(let r=N-1,k=0;r>=0;r--,k++){const i=r*N+c;if(k<keep.length)this.board[i]=keep[k];else{this.board[i]=Math.floor(this.random()*TYPES);fresh.push(i);}}}return fresh;}
 addPoints(count,combo){const p=count*100*Math.min(combo,4);this.score+=p;this.roundScore+=p;return p;}
 finishTurn(){if(!this.legalMoves().length)this.makeBoard();if(this.moves===0){this.roundOver=true;this.complete=true;}}

}
const el=id=>document.getElementById(id),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let model=new Model(),active=false,busy=false,selected=-1,focusIndex=0,token=0,onClose=null;
const boardEl=el('sugar-board');
function message(s){el('sugar-message').textContent=s;}
function stats(){el('sugar-round').textContent=model.round+' / 1';el('sugar-score').textContent=model.score.toLocaleString('en-GB');el('sugar-moves').textContent=model.moves;el('sugar-goal').textContent='ROUND GOAL '+model.goal.toLocaleString('en-GB');el('sugar-progress').style.width=Math.min(100,model.roundScore/model.goal*100)+'%';boardEl.setAttribute('aria-busy',String(busy));}
function render(fresh=[]){
 boardEl.replaceChildren();model.board.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='sweet'+(i===selected?' selected':'')+(fresh.includes(i)?' fresh':'');b.dataset.index=i;b.tabIndex=i===focusIndex?0:-1;b.setAttribute('role','gridcell');b.setAttribute('aria-label',names[t]+', row '+(Math.floor(i/N)+1)+', column '+(i%N+1));b.setAttribute('aria-selected',String(i===selected));b.innerHTML='<svg viewBox="0 0 56 56" aria-hidden="true">'+shapes[t]+'</svg>';
 let touchStart=null;b.addEventListener('pointerdown',e=>{if(busy||model.roundOver)return;e.preventDefault();touchStart={x:e.clientX,y:e.clientY,id:e.pointerId};b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',e=>{if(!touchStart||touchStart.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.hypot(dx,dy)>16){const j=Math.abs(dx)>Math.abs(dy)?i+(dx>0?1:-1):i+(dy>0?N:-N);if(model.adjacent(i,j))attempt(i,j);}else pick(i);});b.addEventListener('pointercancel',()=>{touchStart=null;});b.addEventListener('click',e=>{if(e.detail===0)pick(i);});boardEl.appendChild(b);});stats();
}
function pick(i){if(!active||busy||model.roundOver)return;focusIndex=i;if(selected===i){selected=-1;render();}else if(selected>=0&&model.adjacent(selected,i)){attempt(selected,i);}else{selected=i;render();message('Now tap a neighbouring sweet to swap.');}}
async function attempt(a,b){
 if(!active||busy||model.roundOver)return false;
 if(!model.swap(a,b)){selected=-1;render();message('That swap makes no match. Try three of the same sweet.');window.gameSound?.('wrong');return false;}
 busy=true;selected=-1;const thisToken=token;render();let combo=1,matched=model.matches();
 while(matched.length&&combo<=25){
   matched.forEach(i=>boardEl.children[i]?.classList.add('matched'));const points=model.addPoints(matched.length,combo);stats();message(combo>1?'SUGAR RUSH! ×'+Math.min(combo,4)+'  +'+points:'SMUSH! +'+points);window.gameSound?.('smush',combo);
   await wait(230);if(thisToken!==token)return false;const fresh=model.collapse(matched);render(fresh);await wait(190);if(thisToken!==token)return false;matched=model.matches();combo++;
 }
 if(matched.length)model.makeBoard();model.finishTurn();busy=false;render();if(model.roundOver)showRoundResult();else if(combo<=2)message('Sweet. Keep matching!');return true;
}
function showRoundResult(){el('sugar-result').classList.remove('hidden');el('sugar-result-kicker').textContent='ROUND COMPLETE';const hit=model.roundScore>=model.goal;el('sugar-result-title').textContent=hit?'Sugar rush!':'Sweet effort!';el('sugar-result-text').textContent='Your score: '+model.score.toLocaleString('en-GB')+'\nMartha is still world leader.\nSomething outside the screen is waiting.';el('sugar-next').textContent='BACK TO CAMP ↙';el('sugar-next').focus();}
function open(callback){onClose=callback;active=true;el('phone-screen').classList.remove('hidden');document.getElementById('game').setAttribute('inert','');document.body.classList.add('phone-active');el('sugar-result').classList.toggle('hidden',!model.roundOver);render();if(model.roundOver)showRoundResult();else message('Tap a sweet, then its neighbour. Or swipe to swap.');el('put-down').focus();}
function close(){if(!active)return;active=false;el('phone-screen').classList.add('hidden');document.getElementById('game').removeAttribute('inert');document.body.classList.remove('phone-active');selected=-1;const cb=onClose;onClose=null;if(cb)cb({complete:model.complete,score:model.score,round:model.round});}
function reset(){token++;busy=false;selected=-1;focusIndex=0;model=new Model();active=false;onClose=null;el('phone-screen').classList.add('hidden');el('sugar-result').classList.add('hidden');document.getElementById('game').removeAttribute('inert');document.body.classList.remove('phone-active');}
function hint(){if(busy||model.roundOver)return;const m=model.legalMoves()[0];if(!m)return;boardEl.querySelectorAll('.hint').forEach(b=>b.classList.remove('hint'));m.forEach(i=>boardEl.children[i]?.classList.add('hint'));message('Swap the two sparkling sweets.');}
function next(){if(model.complete)close();}
function keydown(e){if(!active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(busy||model.roundOver)return;const map={ArrowLeft:-1,ArrowRight:1,ArrowUp:-N,ArrowDown:N};if(map[e.key]!==undefined){e.preventDefault();e.stopImmediatePropagation();const next=focusIndex+map[e.key];if(model.adjacent(focusIndex,next)){focusIndex=next;render();boardEl.children[focusIndex]?.focus();}}else if((e.key==='Enter'||e.key===' ')&&document.activeElement?.parentElement===boardEl){e.preventDefault();e.stopImmediatePropagation();pick(focusIndex);boardEl.children[focusIndex]?.focus();}}
// Only permit tab focus inside the phone while its full-screen view is active.
function trapFocus(e){if(!active||e.key!=='Tab')return;const nodes=[...el('phone-screen').querySelectorAll('button:not([tabindex="-1"])')].filter(b=>!b.closest('.hidden'));if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
window.addEventListener('keydown',keydown);window.addEventListener('keydown',trapFocus);el('put-down').onclick=close;el('sugar-next').onclick=next;el('sugar-hint').onclick=hint;
window.SugarSmush={open,close,reset,Model,attempt,pick,next,hint,get model(){return model},get busy(){return busy},get active(){return active}};
})();
