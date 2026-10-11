/* Fictional cached phone evidence. Both characters are adults. */
'use strict';
(()=>{
 const el=id=>document.getElementById(id);let active=false,owner=null,done=null;
 const conversation=[
 ['olivia','Hey you. Still thinking about last night? 😉','20:06'],
 ['liam','I was trying to be mysterious. Lasted about four minutes.','20:07'],
 ['olivia','Cute. You weren’t very mysterious in my DMs.','20:07'],
 ['liam','You said you liked a man who knew what he wanted.','20:08'],
 ['olivia','And what DO you want, Liam?','20:08'],
 ['liam','A little less imagination. A little more you.','20:09'],
 ['olivia','Then don’t be shy. There’s something just for you in VIP 🔒','20:10'],
 ['liam','You know exactly what you’re doing, don’t you?','20:11'],
 ['olivia','Only when I have your full attention. Do I?','20:11'],
 ['liam','They’re making us hand our phones in tomorrow. Some detox camp.','20:12'],
 ['olivia','So you’re leaving me already? I thought we had a thing.','20:13'],
 ['liam','I’m taking you with me. Inside pocket. Our secret.','20:14'],
 ['olivia','Good boy. I like a man who can keep a secret 😉','20:14'],
 ['liam','If I sneak out tonight, will you still be awake?','22:02'],
 ['olivia','For you? Always. Come find me.','22:03'],
 ['liam','How did you know which cabin I’m in?','22:09'],
 ['olivia','You left the light on.','22:10'],
 ['liam','Olivia?','22:12'],
 ['olivia','Don’t turn around.','22:17']
 ];
 function renderChat(){const box=el('chat-messages');box.replaceChildren();conversation.forEach(([who,text,time])=>{const row=document.createElement('div');row.className='chat-row '+who;const name=document.createElement('span');name.className='chat-name';name.textContent=who==='liam'?'LIAM':'OLIVIA DREAMS';const msg=document.createElement('p');msg.textContent=text;const stamp=document.createElement('span');stamp.className='chat-stamp';stamp.textContent=time+(who==='liam'?' ✓✓':'');row.appendChild(name);row.appendChild(msg);row.appendChild(stamp);box.appendChild(row);});}
 function open(id,callback){if(active||!['liam','willow'].includes(id))return;active=true;owner=id;done=callback;
  el('clue-phone').classList.remove('hidden');el('game').setAttribute('inert','');document.body.classList.add('phone-active');
  const chat=id==='liam';el('clue-phone').classList.toggle('is-selfie',!chat);el('chat-page').classList.toggle('hidden',!chat);el('selfie-page').classList.toggle('hidden',chat);
  el('clue-owner').textContent=chat?'LIAM’S PHONE':'WILLOW’S PHONE';el('clue-title').textContent=chat?'Olivia Dreams':'Willow’s feed';el('clue-subtitle').textContent=chat?'Private chat · cached offline':'Regime X diet pills · paid partnership';el('clue-avatar').textContent=chat?'OD':'W';el('clue-footer-text').textContent=chat?'Scroll to read. Something is wrong.':'Saved to camera roll. Where is Willow?';el('close-clue').focus();
 }
 function close(){if(!active)return;active=false;el('clue-phone').classList.add('hidden');el('game').removeAttribute('inert');document.body.classList.remove('phone-active');const cb=done;done=null;owner=null;if(cb)cb();}
 function reset(){active=false;owner=null;done=null;el('clue-phone').classList.add('hidden');el('game').removeAttribute('inert');document.body.classList.remove('phone-active');el('chat-page').scrollTop=0;el('selfie-page').scrollTop=0;}
 el('close-clue').onclick=close;el('clue-return').onclick=close;
 window.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key==='Tab'){const content=el(owner==='liam'?'chat-page':'selfie-page'),focusables=[el('close-clue'),content,el('clue-return')],i=focusables.indexOf(document.activeElement);e.preventDefault();focusables[(i+(e.shiftKey?-1:1)+focusables.length)%focusables.length].focus();}});
 renderChat();window.CampPhones={open,close,reset,get active(){return active;},get owner(){return owner;}};
})();
