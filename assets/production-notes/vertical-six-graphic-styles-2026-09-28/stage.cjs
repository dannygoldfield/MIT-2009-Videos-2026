const {createCanvas}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const palette=['#ffda36','#ff5267','#45e89b','#ff94d5','#48baff','#b78bff'];
const clamp=x=>Math.max(0,Math.min(1,x)),fract=x=>x-Math.floor(x),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const alpha=(c,a)=>c+Math.round(255*clamp(a)).toString(16).padStart(2,'0');
function mix(a,b,u){return '#'+[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-u)+parseInt(b.slice(k,k+2),16)*u).toString(16).padStart(2,'0')).join('');}
function hue(t){const x=Math.min(5.999,t*.6),i=Math.floor(x);return mix(palette[i],palette[(i+1)%6],smooth((fract(x)-.63)/.37));}
function box(c,x,y,w,h,r,col,stroke=0){c.beginPath();c.roundRect(x,y,w,h,r);if(stroke){c.strokeStyle=col;c.lineWidth=stroke;c.stroke();}else{c.fillStyle=col;c.fill();}}
function line(c,pts,col,w=2){c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
const sprites=new Map();
function glow(c,x,y,r,col,a){if(!sprites.has(col)){const s=createCanvas(96,96),q=s.getContext('2d'),g=q.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,alpha(col,.85));g.addColorStop(.22,alpha(col,.38));g.addColorStop(1,alpha(col,0));q.fillStyle=g;q.fillRect(0,0,96,96);if(sprites.size>128)sprites.clear();sprites.set(col,s);}c.save();c.globalAlpha=a;c.globalCompositeOperation='screen';c.drawImage(sprites.get(col),x-r/2,y-r/2,r,r);c.restore();}
function outsideWindows(c,rect){c.beginPath();c.rect(0,0,1080,1920);for(let i=0;i<6;i++){const r=rect(i);c.rect(r.x,r.y,r.w,r.h);}c.clip('evenodd');}
function rainbow(c,x,y,xx,yy,t,a=1){const g=c.createLinearGradient(x,y,xx,yy);for(let i=0;i<7;i++)g.addColorStop(i/6,alpha(palette[(i+Math.floor(t))%6],a));return g;}
function pathRibbon(c,y,t,offset,col,width){c.beginPath();for(let x=-120;x<1200;x+=12){const yy=y+Math.sin(x*.006+t*.85+offset)*42+Math.sin(x*.011-t*.42+offset)*16;if(x===-120)c.moveTo(x,yy);else c.lineTo(x,yy);}c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.stroke();}
function createStage(style){
  const base=createCanvas(1080,1920),b=base.getContext('2d');
  const bg=b.createLinearGradient(0,0,1080,1920);
  const bgColors=style==='neon'?['#110922','#01020a','#0c1230']:style==='ribbons'?['#073245','#03171e','#1b2449']:['#131927','#050b15','#142232'];
  bg.addColorStop(0,bgColors[0]);bg.addColorStop(.5,bgColors[1]);bg.addColorStop(1,bgColors[2]);b.fillStyle=bg;b.fillRect(0,0,1080,1920);
  if(style==='neon'){
    box(b,27,72,1026,1790,52,'#01030c');box(b,35,80,1010,1774,46,'#66758b',2);box(b,65,244,950,1440,16,'#01040b');
  }else if(style==='ribbons'){
    box(b,32,74,1016,1784,56,'#91d5e414',2);box(b,65,244,950,1440,20,'#011017');
  }else{
    box(b,28,78,1024,1780,5,'#526175',3);box(b,48,98,984,1740,2,'#0b1320');
    for(let x=58;x<1025;x+=18)for(let y=109;y<1835;y+=18)box(b,x,y,4,4,0,'#38465b44');
    box(b,65,244,950,1440,2,'#020711');
  }
  function back(c,t){c.drawImage(base,0,0);}
  function neon(c,t,rect){
    const won=t>=10,u=Math.max(0,t-10),col=hue(t),pulse=.5+.5*Math.cos(t*4*Math.PI);
    c.save();outsideWindows(c,rect);
    for(let k=0;k<3;k++){
      const color=won?palette[k*2]:col;
      box(c,40+k*10,85+k*10,1000-k*20,1760-k*20,43-k*7,alpha(color,.12),14);
      box(c,40+k*10,85+k*10,1000-k*20,1760-k*20,43-k*7,alpha(color,.7-k*.17),2);
    }
    const circuit=[[[84,197],[290,197],[319,168],[450,168]],[[630,168],[761,168],[790,197],[996,197]],[[84,1730],[290,1730],[319,1760],[450,1760]],[[630,1760],[761,1760],[790,1730],[996,1730]]];
    circuit.forEach((p,i)=>{const color=won?palette[i]:col;line(c,p,alpha(color,.20),15);line(c,p,alpha(color,.95),3);for(const pt of [p[0],p.at(-1)]){glow(c,...pt,75,color,.7);box(c,pt[0]-3,pt[1]-3,6,6,3,'#edfcff');}});
    const routes=[[[540,248],[540,1680]],[[74,726],[1006,726]],[[74,1202],[1006,1202]]];
    routes.forEach((p,i)=>{const color=won?palette[(i*2+Math.floor(u*.9))%6]:col;line(c,p,alpha(color,.25),22);line(c,p,alpha(color,.85),7);line(c,p,alpha('#effcff',.44),1.2);
      for(let j=0;j<4;j++){const f=fract(t*.13+j/4),x=p[0][0]+(p[1][0]-p[0][0])*f,y=p[0][1]+(p[1][1]-p[0][1])*f;glow(c,x,y,170,color,.8);}});
    if(won){
      for(let k=0;k<6;k++){const rr=fract(u*.42+k/6)*1580;c.beginPath();c.ellipse(540,960,rr,rr*1.55,0,0,Math.PI*2);c.strokeStyle=alpha(palette[k],(1-rr/1580)*.82);c.lineWidth=5+5*pulse;c.stroke();}
      for(let k=0;k<24;k++){const a=k*Math.PI/12;line(c,[[540,960],[540+Math.cos(a)*1500,960+Math.sin(a)*2200]],alpha(palette[k%6],.16+.18*pulse),k%3?3:11);}
    }
    c.restore();
    for(let i=0;i<6;i++){const r=rect(i),co=won?palette[i]:col;box(c,r.x-2,r.y-2,r.w+4,r.h+4,9,alpha(co,won?.85:.38),2);}
  }
  function ribbons(c,t,rect){
    const won=t>=10,u=Math.max(0,t-10),co=hue(t);
    c.save();outsideWindows(c,rect);
    for(let k=0;k<6;k++){
      const col=won?palette[k]:mix(co,'#bbf5ff',k*.035);
      glow(c,540+Math.sin(t*.52+k)*510,130+k*330,620,col,.22);
      for(const y of [150,1790])pathRibbon(c,y,t,k*.36,alpha(col,won?.28:.13),20+k*3);
    }
    // One continuous colored field flows through both crossbars and the spine.
    const g=won?rainbow(c,0,180,1080,1740,u*.14,.9):c.createLinearGradient(0,0,1080,1920);
    if(!won){g.addColorStop(0,mix(co,'#e2ffff',.42));g.addColorStop(.46,co);g.addColorStop(1,mix(co,'#bde4ff',.20));}
    c.fillStyle=g;c.fillRect(532,256,16,1416);c.fillRect(76,720,928,12);c.fillRect(76,1196,928,12);
    for(let k=0;k<5;k++){
      const y=256+fract(t*.075+k/5)*1416;
      glow(c,540,y,270,won?palette[k]:co,.9);
      for(const yy of [726,1202])glow(c,76+fract(t*.10+k/5)*928,yy,300,won?palette[k]:co,.55);
    }
    for(let k=0;k<3;k++){
      c.beginPath();for(let y=92;y<1840;y+=12){const x=42+Math.sin(y*.007+t*.7+k*.8)*12;if(y===92)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle=won?palette[k]:alpha(co,.55);c.lineWidth=4;c.stroke();
      c.beginPath();for(let y=92;y<1840;y+=12){const x=1038+Math.sin(y*.007-t*.7+k*.8)*12;if(y===92)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle=won?palette[k+3]:alpha(co,.55);c.stroke();
    }
    if(won)for(let k=0;k<6;k++){
      const y=100+fract(u*.10+k/6)*1760;pathRibbon(c,y,u*1.1,k,alpha(palette[k],.64),28);
      const r=250+u*180+k*36;c.beginPath();c.ellipse(540,960,r,r*1.48,.07*Math.sin(u),0,Math.PI*2);c.lineWidth=14;c.strokeStyle=alpha(palette[k],Math.exp(-u*.9)*.55);c.stroke();
    }
    c.restore();
    for(let i=0;i<6;i++){const r=rect(i);box(c,r.x-2,r.y-2,r.w+4,r.h+4,12,alpha(won?palette[i]:co,won?.9:.5),2);}
  }
  function pixels(c,t,rect){
    const won=t>=10,u=Math.max(0,t-10),co=hue(t),beat=.5+.5*Math.cos(4*Math.PI*t);
    c.save();outsideWindows(c,rect);
    for(let x=81,j=0;x<1000;x+=22,j++)for(const y0 of [215,1712]){
      const bars=1+Math.floor(4*(.5+.5*Math.sin(j*.39-t*2.7))),col=won?palette[j%6]:co;
      for(let k=0;k<bars;k++){const y=y0===215?y0-k*18:y0+k*18;box(c,x,y,15,11,1,alpha(col,.45+k*.1));}
    }
    for(let y=113,j=0;y<1820;y+=25,j++)for(const x of [41,1028]){const co2=won?palette[Math.floor(j/6)%6]:co;box(c,x,y,10,15,1,alpha(co2,.2+.65*(.5+.5*Math.sin(j*.45-t*3))));}
    // The narrow window gaps are true LED pixel strips, visible from frame one.
    for(let y=258,j=0;y<1672;y+=13,j++){
      const p=.38+.6*(.5+.5*Math.sin(j*.25-t*4));box(c,534,y,12,9,1,alpha(won?palette[Math.floor(j/17)%6]:co,p));
    }
    for(const y of [722,1198])for(let x=78,j=0;x<1000;x+=16,j++)box(c,x,y,12,8,1,alpha(won?palette[Math.floor(j/10)%6]:co,.4+.6*(.5+.5*Math.sin(j*.28-t*3))));
    for(const y of [112,1810])for(let x=86,j=0;x<993;x+=24,j++)box(c,x,y,16,8,0,alpha(won?palette[j%6]:co,.5));
    if(won){
      for(let k=0;k<96;k++){
        const a=k*2.399963,life=fract(u*.35+k*.037),d=140+life*1600,x=540+Math.cos(a)*d,y=960+Math.sin(a)*d*1.6,size=8+(k%4)*5;
        box(c,Math.round(x/8)*8,Math.round(y/8)*8,size,size,0,alpha(palette[k%6],(1-life)*.9));
      }
      for(let k=0;k<6;k++){
        const d=fract(u*.35+k/6)*1800;line(c,[[540,960-d],[540+d*.65,960],[540,960+d],[540-d*.65,960],[540,960-d]],alpha(palette[k],(1-d/1800)*.65),6+beat*4);
      }
    }
    c.restore();
    for(let i=0;i<6;i++){const r=rect(i),col=won?palette[i]:co;box(c,r.x-2,r.y-2,r.w+4,r.h+4,2,alpha(col,.45),2);for(const [x,y]of[[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]])box(c,x-4,y-4,8,8,0,alpha(col,.9));}
  }
  const draw={neon,ribbons,pixels}[style];
  function front(c,t,rect){draw(c,t,rect);}
  return{back,front};
}
module.exports={createStage};
