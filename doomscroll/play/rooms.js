/* Enterable cabin space. Coordinates are independent of the outside map. */
'use strict';
(()=>{
 const themes={
  '01':{name:'THE OLD BUNKHOUSE',left:'#8b7763',right:'#6c7f73',roof:'#4f5e45',trim:'#b4a577'},
  '02':{name:'LIAM / LOST PROPERTY',left:'#667e95',right:'#aa8a6b',roof:'#536b69',trim:'#91b0ac'},
  '03':{name:'MARTHA / ONE MORE GAME',left:'#9d7f8e',right:'#7b9088',roof:'#655b47',trim:'#cfb279'},
  '04':{name:'WILLOW / LIGHTS OUT',left:'#a17b9b',right:'#857298',roof:'#544d5c',trim:'#bca5b9'}
 };
 const beds=[{x:48,y:90,w:82,h:90},{x:230,y:90,w:72,h:90}],furniture=[...beds,{x:46,y:250,w:50,h:52},{x:244,y:250,w:62,h:45},{x:205,y:121,w:17,h:22}];
 const items={door:{x:180,y:372},torch:{x:114,y:281},martha:{x:214,y:143},note:{x:182,y:95},hide:{x:101,y:210}};
 const notes={'01':['Someone has carved tally marks into the bedframe.','The laundry is still hanging outside cabin 02. Nobody has come to collect it.'],'02':['Liam’s jacket is gone. A damp towel is left on his bunk.','A note: “Dropped my phone by the washing line. Back in a minute.”'],'03':['Martha’s charger runs under the bedside table.','Willow wrote: “Meet me by the lake. I think I dropped my phone.”'],'04':['A ring light. An empty pill bottle. A cracked mirror.','A smear on the window points towards the lake.']};
 function blocked(x,y){return x<35||x>325||y<62||y>375||furniture.some(r=>x>r.x-5&&x<r.x+r.w+5&&y>r.y-4&&y<r.y+r.h+4);}
 function draw(ctx,height,room,player,o){const theme=themes[room.n],viewHeight=Math.max(145,height-275),cameraY=Math.max(0,Math.min(Math.max(0,420-viewHeight),player.y-viewHeight*.55)),oy=142-cameraY;
  ctx.fillStyle='#08130f';ctx.fillRect(0,0,360,height);ctx.save();ctx.beginPath();ctx.rect(0,130,360,viewHeight+10);ctx.clip();ctx.translate(0,oy);ctx.imageSmoothingEnabled=false;
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)},text=(t,x,y,c='#d8cea7',z=9)=>{ctx.fillStyle=c;ctx.font=z+'px monospace';ctx.fillText(t,x,y)};
  r(24,30,312,355,'#25372c');r(30,43,300,337,'#6b583e');for(let y=47;y<379;y+=13){r(32,y,296,1,'#443e2e');for(let x=36;x<325;x+=50){r(x+(y%3)*4,y+7,22,1,'#8c714d');r(x+25,y+4,2,1,'#a28656');}}
  r(23,26,314,22,'#8a7651');r(25,32,308,3,'#af9666');r(24,46,8,338,'#3b4931');r(329,46,7,338,'#283b2d');text('CABIN '+room.n+' / '+theme.name,44,42,'#e6d6aa',9);
  r(128,48,94,30,'#394d3d');r(133,51,84,21,'#233c35');r(135,54,34,9,'#627d6750');r(172,50,3,25,'#ba9e65');r(130,73,92,5,'#9b8157');r(125,50,4,26,'#88745a');r(222,50,4,26,'#88745a');
  for(let i=0;i<2;i++){const b=beds[i];r(b.x+3,b.y+5,b.w+3,b.h+4,'#352f2380');r(b.x,b.y,b.w,b.h,'#9d8258');r(b.x+5,b.y+5,b.w-10,b.h-12,i?theme.right:theme.left);for(let yy=b.y+27;yy<b.y+b.h-10;yy+=10)r(b.x+7,yy,b.w-14,2,i?'#546f68':'#766751');r(b.x+8,b.y+8,b.w-16,19,'#d6c8a5');r(b.x+10,b.y+10,b.w-21,3,'#eee0b7');r(b.x+2,b.y+b.h-1,5,12,'#514c32');r(b.x+b.w-7,b.y+b.h-1,5,12,'#514c32');}
  r(205,121,17,24,'#7d6745');r(207,123,13,3,'#b89965');r(209,133,4,2,'#d8c597');text(room.n==='03'?'M':room.n==='02'?'L':room.n==='04'?'W':'?',239,114,'#3b5146',9);r(176,88,14,18,'#d7cb9f');r(178,92,10,1,'#826c4b');r(178,96,8,1,'#826c4b');
  r(46,250,50,52,'#675338');r(49,252,44,5,'#9c7e51');for(let y=268;y<300;y+=14){r(49,y,44,2,'#403d2c');r(65,y+5,11,2,'#b5a16b');}r(244,250,62,45,'#725c40');r(247,253,56,5,'#a2875c');r(263,239,13,15,'#d0b06b');r(260,237,19,3,'#405238');r(266,241,7,8,'#ffe09b');r(252,264,15,13,'#b59d72');r(282,265,17,2,'#d6c497');
  // Small personal objects sit on furniture or walls, leaving the walkways clear.
  if(room.n==='01'){
   for(let i=0;i<7;i++)r(59+i*5,38,1,7,'#352c24');r(59,42,34,1,'#352c24');
   r(53,130,24,31,'#504c3c');r(55,132,20,26,'#7e7258');r(61,145,6,2,'#baac76');
   r(292,56,25,26,'#846847');r(295,59,19,20,'#b49c6e');text('1987',294,72,'#483d2f',7);
   for(let i=0;i<3;i++){r(51+i*12,257,8,6,'#867963');r(52+i*12,258,6,2,'#b1a485');}
  }else if(room.n==='02'){
   r(76,122,28,37,'#35495d');r(72,126,6,23,'#4b6173');r(102,126,6,23,'#4b6173');r(88,123,2,32,'#819ba8');
   r(246,281,19,8,'#75878d');r(249,279,14,2,'#b6c6bb');r(273,266,12,9,'#55554b');r(277,262,4,7,'#bda878');
   r(47,61,46,19,'#7b806f');text('STAY',52,70,'#d4d0a9',8);text('PRESENT',50,78,'#d4d0a9',6);
   r(270,131,20,26,'#987653');r(275,137,10,15,'#ad926c');
  }else if(room.n==='03'){
   r(66,126,36,24,'#b09370');r(69,128,30,19,'#6c505f');text('SMUSH',72,141,'#e8b6c4',7);
   for(let i=0;i<5;i++){r(51+i*8,257,6,4,['#cb8aab','#d9c36f','#a3b797'][i%3]);r(52+i*8,256,4,1,'#eee0b1');}
   r(268,270,23,4,'#b797a6');r(269,271,20,1,'#ecc5d2');
   r(41,75,1,24,'#6e6c56');r(41,98,8,1,'#6e6c56');
  }else{
   r(267,271,14,11,'#69646b');r(269,271,10,5,'#191e23');r(271,269,5,3,'#948892');
   r(286,267,7,14,'#c8b6ba');r(287,266,5,3,'#7b6375');r(287,272,5,5,'#a798b1');
   r(57,258,16,2,'#b485ac');r(70,256,4,4,'#dfbdd0');r(81,255,4,8,'#b6a17b');
   r(278,53,28,31,'#796579');r(281,56,22,24,'#52646b');r(286,57,1,11,'#c4b6b5');r(287,67,9,1,'#c4b6b5');r(296,66,1,11,'#c4b6b5');
   r(241,63,14,15,'#c4b7b2');r(244,66,8,9,'#495455');r(247,78,2,6,'#978991');
   for(let i=0;i<4;i++)r(144+i*14,56,10,1,'#b2b9ac');
  }
  r(148,377,64,8,'#9b8357');r(151,376,58,3,'#ddc18a');r(154,379,52,6,'#253a2e');text('EXIT',165,399,'#d9c49a',10);
  const actors=[{y:player.y,draw:()=>{if(!o.hidden)o.person(player.x,player.y,'#c08458',player.walk,player.face,false,player.phone);}}];
  if(room.n==='03'&&!o.hasTorch){r(108,269,7,14,'#445449');r(109,270,5,4,'#ead79b');r(109,277,5,2,'#1d352b');}
  if(room.n==='03'&&!o.marthaCollected&&o.hasTorch)actors.push({y:items.martha.y,draw:()=>{o.glow(items.martha.x,items.martha.y-5,34,'#87ded132');o.phone(items.martha);}});
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());o.glow(270,240,130,'#d9af4922');
  if(o.hidden)text('UNDER THE BUNK. WAIT FOR SILENCE.',64,329,'#d3caa6',9);ctx.restore();
 }
 window.CampRooms={items,notes,themes,blocked,draw};
})();
