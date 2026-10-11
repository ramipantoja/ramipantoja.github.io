/* Enterable cabin space. Coordinates are independent of the outside map. */
'use strict';
(()=>{
 const beds=[{x:48,y:90,w:82,h:90},{x:230,y:90,w:72,h:90}],furniture=[...beds,{x:46,y:250,w:50,h:52},{x:244,y:250,w:62,h:45},{x:205,y:121,w:17,h:22}];
 const items={door:{x:180,y:372},torch:{x:114,y:281},martha:{x:214,y:143},note:{x:182,y:95},hide:{x:101,y:210}};
 const notes={'01':['Someone has carved tally marks into the bedframe.','The laundry is still hanging outside cabin 02. Nobody has come to collect it.'],'02':['Liam’s jacket is gone. A damp towel is left on his bunk.','A note: “Laundry hamper. Under the clean towels.”'],'03':['Martha’s charger runs under the bedside table.','Willow wrote: “Meet me by the lake. Bring my bag.”'],'04':['A ring light. An empty pill bottle. A cracked mirror.','A smear on the window points towards the lake.']};
 function blocked(x,y){return x<35||x>325||y<62||y>375||furniture.some(r=>x>r.x-5&&x<r.x+r.w+5&&y>r.y-4&&y<r.y+r.h+4);}
 function draw(ctx,height,room,player,o){const viewHeight=Math.max(145,height-275),cameraY=Math.max(0,Math.min(Math.max(0,420-viewHeight),player.y-viewHeight*.55)),oy=142-cameraY;
  ctx.fillStyle='#08130f';ctx.fillRect(0,0,360,height);ctx.save();ctx.beginPath();ctx.rect(0,130,360,viewHeight+10);ctx.clip();ctx.translate(0,oy);ctx.imageSmoothingEnabled=false;
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)},text=(t,x,y,c='#d8cea7',z=9)=>{ctx.fillStyle=c;ctx.font=z+'px monospace';ctx.fillText(t,x,y)};
  r(24,30,312,355,'#25372c');r(30,43,300,337,'#6b583e');for(let y=47;y<379;y+=13){r(32,y,296,1,'#443e2e');for(let x=36;x<325;x+=50){r(x+(y%3)*4,y+7,22,1,'#8c714d');r(x+25,y+4,2,1,'#a28656');}}
  r(23,26,314,22,'#8a7651');r(25,32,308,3,'#af9666');r(24,46,8,338,'#3b4931');r(329,46,7,338,'#283b2d');text('CABIN '+room.n+' / '+(room.n==='03'?'MARTHA’S BUNK':'LIGHTS OUT'),44,42,'#e6d6aa',9);
  r(128,48,94,30,'#394d3d');r(133,51,84,21,'#233c35');r(135,54,34,9,'#627d6750');r(172,50,3,25,'#ba9e65');r(130,73,92,5,'#9b8157');r(125,50,4,26,'#88745a');r(222,50,4,26,'#88745a');
  for(let i=0;i<2;i++){const b=beds[i];r(b.x+3,b.y+5,b.w+3,b.h+4,'#352f2380');r(b.x,b.y,b.w,b.h,'#9d8258');r(b.x+5,b.y+5,b.w-10,b.h-12,i?'#7b9088':'#a79679');for(let yy=b.y+27;yy<b.y+b.h-10;yy+=10)r(b.x+7,yy,b.w-14,2,i?'#546f68':'#766751');r(b.x+8,b.y+8,b.w-16,19,'#d6c8a5');r(b.x+10,b.y+10,b.w-21,3,'#eee0b7');r(b.x+2,b.y+b.h-1,5,12,'#514c32');r(b.x+b.w-7,b.y+b.h-1,5,12,'#514c32');}
  r(205,121,17,24,'#7d6745');r(207,123,13,3,'#b89965');r(209,133,4,2,'#d8c597');text('M',239,114,'#3b5146',9);r(176,88,14,18,'#d7cb9f');r(178,92,10,1,'#826c4b');r(178,96,8,1,'#826c4b');
  r(46,250,50,52,'#675338');r(49,252,44,5,'#9c7e51');for(let y=268;y<300;y+=14){r(49,y,44,2,'#403d2c');r(65,y+5,11,2,'#b5a16b');}r(244,250,62,45,'#725c40');r(247,253,56,5,'#a2875c');r(263,239,13,15,'#d0b06b');r(260,237,19,3,'#405238');r(266,241,7,8,'#ffe09b');r(252,264,15,13,'#b59d72');r(282,265,17,2,'#d6c497');
  r(148,377,64,8,'#9b8357');r(151,376,58,3,'#ddc18a');r(154,379,52,6,'#253a2e');text('EXIT',165,399,'#d9c49a',10);
  const actors=[{y:player.y,draw:()=>{if(!o.hidden)o.person(player.x,player.y,'#c08458',player.walk,player.face,false,player.phone);}}];
  if(room.n==='03'&&!o.hasTorch){r(108,269,7,14,'#445449');r(109,270,5,4,'#ead79b');r(109,277,5,2,'#1d352b');}
  if(room.n==='03'&&!o.marthaCollected&&o.hasTorch)actors.push({y:items.martha.y,draw:()=>{o.glow(items.martha.x,items.martha.y-5,34,'#87ded132');o.phone(items.martha);}});
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());o.glow(270,240,130,'#d9af4922');
  if(o.hidden)text('UNDER THE BUNK. WAIT FOR SILENCE.',64,329,'#d3caa6',9);ctx.restore();
 }
 window.CampRooms={items,notes,blocked,draw};
})();
