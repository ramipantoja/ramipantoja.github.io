/* Original procedural horror score and layered Foley. No external audio files. */
'use strict';
(()=>{
 let context=null,master=null,music=null,ambience=null,effects=null,noise=null,enabled=false,mood='quiet',beat=0,scoreClock=0,pulseClock=0;
 const active=new Set();
 const soft=(param,value,time=.25)=>{param.cancelScheduledValues(context.currentTime);param.setTargetAtTime(value,context.currentTime,time);};
 function initialise(){if(context)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Audio unavailable');context=new AC();
  master=context.createGain();master.gain.value=.7;const compressor=context.createDynamicsCompressor();compressor.threshold.value=-22;compressor.ratio.value=4;master.connect(compressor);compressor.connect(context.destination);
  music=context.createGain();music.gain.value=.36;music.connect(master);ambience=context.createGain();ambience.gain.value=.3;ambience.connect(master);effects=context.createGain();effects.gain.value=.68;effects.connect(master);
  // A restrained tape-like echo gives the original score space without washing out Foley.
  const delay=context.createDelay(2),feedback=context.createGain(),damp=context.createBiquadFilter(),wet=context.createGain();delay.delayTime.value=.41;feedback.gain.value=.22;damp.type='lowpass';damp.frequency.value=1400;wet.gain.value=.2;music.connect(delay);delay.connect(damp);damp.connect(feedback);feedback.connect(delay);damp.connect(wet);wet.connect(master);
  noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const wind=context.createBufferSource(),filter=context.createBiquadFilter(),level=context.createGain();wind.buffer=noise;wind.loop=true;filter.type='bandpass';filter.frequency.value=210;filter.Q.value=.7;level.gain.value=.065;wind.connect(filter);filter.connect(level);level.connect(ambience);wind.start();
 }
 function enable(on){try{if(on)initialise();enabled=!!on;if(context){if(on)context.resume().catch(()=>{});else context.suspend().catch(()=>{});}return enabled;}catch{enabled=false;return false;}}
 function voice(freq,duration,volume=.03,type='sine',slide=0,bus=effects,pan=0,delay=0){if(!enabled||!context)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+Math.min(.06,duration*.2));g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);const spatial=connect(g,bus,pan);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();spatial?.disconnect();};o.start(t);o.stop(t+duration+.04);}
 function connect(node,bus,pan){if(context.createStereoPanner){const p=context.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node.connect(p);p.connect(bus);return p;}else node.connect(bus);return null;}
 function rustle(duration=.15,volume=.035,freq=1100,pan=0,bus=effects,delay=0){if(!enabled||!context)return;const source=context.createBufferSource(),g=context.createGain(),f=context.createBiquadFilter(),t=context.currentTime+delay;source.buffer=noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=.8;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);source.connect(f);f.connect(g);const spatial=connect(g,bus,pan);active.add(source);source.onended=()=>{active.delete(source);source.disconnect();f.disconnect();g.disconnect();spatial?.disconnect();};source.start(t,Math.random());source.stop(t+duration);}
 function fx(kind,amount=1,pan=0){if(!enabled||amount<=0)return;const a=Math.max(0,Math.min(1,amount));
  if(kind==='step'){rustle(.12,.06*a,650,pan);voice(86,.1,.032*a,'triangle',-32,effects,pan);rustle(.06,.023*a,1600,pan,effects,.04);}
  if(kind==='breath')rustle(.45,.045*a,620,pan);
  if(kind==='heartbeat'){voice(66,.16,.06*a,'sine',-24);voice(58,.19,.04*a,'sine',-22,effects,0,.21);}
  if(kind==='twig'){rustle(.065,.1*a,2300,pan);voice(175,.08,.025*a,'triangle',-110,effects,pan);}
  if(kind==='fire'){rustle(.08,.055*a,2200,pan);voice(190,.04,.018*a,'square',-80,effects,pan);}
  if(kind==='notification'){voice(880,.18,.07*a,'sine');voice(1174,.25,.055*a,'sine',0,effects,0,.13);}
  if(kind==='torch'){rustle(.035,.055*a,2100);voice(520,.035,.016*a,'square',-150);}
  if(kind==='pickup'){rustle(.12,.05*a,850);voice(392,.25,.035*a,'triangle');voice(523,.36,.02*a,'sine',0,effects,0,.12);}
  if(kind==='chase'){voice(73.42,2.6,.085*a,'sawtooth',-35,music);voice(77.78,2.8,.065*a,'triangle',-39,music);rustle(.75,.12*a,420);}
  if(kind==='caught'){rustle(.48,.17*a,900);voice(41,1.3,.13*a,'sawtooth',-20);}
  if(kind==='engine'){voice(48,5.6,.14*a,'sawtooth',74);voice(52,5.6,.06*a,'triangle',76);rustle(1,.1*a,280);}
  if(kind==='door'){rustle(.13,.16*a,450);voice(110,.17,.11*a,'triangle',-70);}
  if(kind==='static')rustle(.5,.09*a,2600);
 }
 function update(dt,nextMood='quiet',paused=false){if(!enabled||!context)return;if(nextMood!==mood){mood=nextMood;scoreClock=0;pulseClock=0;}
  soft(master.gain,paused?0:.7,.08);soft(music.gain,mood==='phone'?.10:mood==='chase'?.42:.34,.5);soft(ambience.gain,mood==='phone'?.06:.3,.5);if(paused)return;
  scoreClock-=dt;pulseClock-=dt;
  if(scoreClock<=0){beat++;const notes=[146.83,155.56,220,174.61,207.65,146.83,138.59,164.81],n=notes[beat%notes.length];
   voice(73.42,4.5,.045,'sine',-.8,music);voice(77.78,3.8,.024,'triangle',-.4,music,-.25);voice(n,mood==='chase'?1.1:3.2,.022,'triangle',-1.3,music,.28);if(beat%3===0)voice(n*4,2.2,.011,'sine',-3,music,-.4);
   scoreClock=mood==='chase'?.82:mood==='cctv'||mood==='end'?4.1:2.8;
  }
  if(mood==='chase'&&pulseClock<=0){fx('heartbeat',.6);fx('breath',.6);pulseClock=.75;}
 }
 function silence(){if(!context)return;soft(master.gain,0,.03);for(const n of active){try{n.stop();}catch{}}active.clear();scoreClock=0;pulseClock=0;}
 window.CampAudio={enable,update,fx,silence,tone:(f,d,v,type,slide)=>voice(f,d,v,type,slide),hiss:(d,v,f)=>rustle(d,v,f),get enabled(){return enabled;}};
})();
