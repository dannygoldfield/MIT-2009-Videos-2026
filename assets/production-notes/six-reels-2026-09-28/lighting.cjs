const {createCanvas}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const colors=['#ffd62a','#ff4a62','#41e297','#ff89c7','#39b6ff','#b37bff'];
const W=300,H=940,CX=150,CY=470;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const frac=x=>x-Math.floor(x);
const alpha=(c,a)=>c+Math.round(clamp(a)*255).toString(16).padStart(2,'0');
const blend=(a,b,u)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-u)+parseInt(b.slice(i,i+2),16)*u).toString(16).padStart(2,'0')).join('');
const sprites=new Map();
function glow(c,x,y,r,col,a=1){
  col='#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(col.slice(i,i+2),16)/16)*16).toString(16).padStart(2,'0')).join('');
  if(!sprites.has(col)){if(sprites.size>256)sprites.delete(sprites.keys().next().value);const s=createCanvas(64,64),q=s.getContext('2d'),g=q.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,alpha(col,.85));g.addColorStop(.15,alpha(col,.55));g.addColorStop(.5,alpha(col,.12));g.addColorStop(1,alpha(col,0));q.fillStyle=g;q.fillRect(0,0,64,64);sprites.set(col,s);}
  c.save();c.globalAlpha=a;c.globalCompositeOperation='screen';c.drawImage(sprites.get(col),x-r/2,y-r/2,r,r);c.restore();
}
function rr(c,x,y,w,h,r,col,width,a=1){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function line(c,pts,col,width=2,a=1){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();}
function dot(c,x,y,col,p,size=5){glow(c,x,y,size*6,col,p*.65);c.fillStyle=alpha(col,.12+.85*p);c.beginPath();c.roundRect(x-size/2,y-size/2,size,size,1.5);c.fill();}
function edge(u,x,y,w,h){let d=frac(u)*2*(w+h);if(d<w)return[x+d,y];d-=w;if(d<h)return[x+w,y+d];d-=h;if(d<w)return[x+w-d,y+h];return[x,y+h-(d-w)];}
function createLighting(style,team,index){
  const bg=createCanvas(W,H),b=bg.getContext('2d');
  const metal=b.createLinearGradient(0,0,W,0);metal.addColorStop(0,'#374251');metal.addColorStop(.025,'#8a98aa');metal.addColorStop(.05,'#17202e');metal.addColorStop(.94,'#0c1019');metal.addColorStop(.98,'#677587');metal.addColorStop(1,'#283342');
  b.fillStyle=metal;b.beginPath();b.roundRect(0,0,W,H,22);b.fill();b.fillStyle='#07101b';b.beginPath();b.roundRect(5,5,W-10,H-10,18);b.fill();
  b.fillStyle='#020407';b.beginPath();b.roundRect(8,174,284,592,13);b.fill();rr(b,8,174,284,592,13,'#8b9aab',1,.5);
  line(b,[[16,161],[284,161]],'#8493a6',1,.22);line(b,[[16,779],[284,779]],'#8493a6',1,.22);
  const shade=createCanvas(W,590),s=shade.getContext('2d'),g=s.createLinearGradient(0,0,0,590);g.addColorStop(0,'#020408eb');g.addColorStop(.22,'#02040888');g.addColorStop(.265,'#02040800');g.addColorStop(.735,'#02040800');g.addColorStop(.78,'#02040888');g.addColorStop(1,'#020408eb');s.fillStyle=g;s.fillRect(0,0,W,590);
  function back(c,t,win){c.drawImage(bg,0,0);glow(c,150,70,340,team,.16+.20*smooth(win));glow(c,150,870,340,team,.13+.18*smooth(win));}
  function front(c,t,win,landing,bands){
    const power=smooth(win/.35),u=Math.max(0,win),pulse=(.5+.5*Math.cos(4*Math.PI*t))**6;
    const phase=Math.min(t,landing-3)/3+index*.25,settle=smooth((t-landing+3)/3);
    const palette=colors.map((_,i)=>{const p=phase+i,k=Math.floor(p),cycling=blend(colors[k%6],colors[(k+1)%6],smooth(frac(p)));return blend(cycling,blend(team,'#edf7ff',i*.055),settle);});
    c.drawImage(shade,0,175);
    if(style==='neon'){
      for(let side=0;side<2;side++)for(let j=0;j<33;j++){const p=.2+(.25+.5*power)*Math.exp(-(((frac(j/12-t*.6)-.5)/.22)**2));dot(c,side?296:4,205+j*16,palette[Math.floor(j/8)%6],p,4);}
      for(let lane=0;lane<3;lane++){const col=palette[lane],d=lane*3;rr(c,6+d,172+d,288-2*d,596-2*d,13,col,1.4,.2+.25*power);for(let n=0;n<3;n++){const pts=Array.from({length:10},(_,j)=>edge(t*(.09+lane*.01)+n/3+j*.003,6+d,172+d,288-2*d,596-2*d));line(c,pts,col,2.3,.55+.45*power);const[x,y]=pts.at(-1);glow(c,x,y,30,col,.5);}}
      for(const y of [82,858])for(let k=0;k<4;k++){const d=k*15;line(c,[[38+d,y+32],[70+d,y],[230-d,y],[262-d,y+32]],palette[k],2,.25+.6*power*(.35+.65*pulse));}
    }else if(style==='prism'){
      for(let k=0;k<5;k++)for(const y of [76,862]){const x=42+k*54,col=palette[k],p=.25+.7*power*(.4+.6*(.5+.5*Math.sin(t*4*Math.PI-k*.65))**3);c.fillStyle=alpha(col,p*.5);c.beginPath();c.moveTo(x-23,y);c.lineTo(x,y-31);c.lineTo(x+23,y);c.lineTo(x,y+31);c.closePath();c.fill();line(c,[[x-23,y],[x,y-31],[x+23,y],[x,y+31],[x-23,y]],col,1.5,p);glow(c,x,y,90,col,p*.5);}
      for(let k=0;k<28;k++){const a=k*Math.PI/14+t*.12,col=palette[k%6];for(const y of [82,858])line(c,[[150+Math.cos(a)*42,y+Math.sin(a)*24],[150+Math.cos(a)*133,y+Math.sin(a)*72]],col,k%4?1:3,(.12+.5*power)*(.3+.7*pulse));}
      for(let k=0;k<4;k++)rr(c,4+k*2,171+k*2,292-k*4,598-k*4,14,palette[k],1,.17+power*.25);
    }else if(style==='orbit'){
      for(let ring=0;ring<3;ring++){const col=palette[ring];for(const y of [83,858]){c.strokeStyle=alpha(col,.45+.4*power);c.lineWidth=1.5;c.beginPath();c.ellipse(150,y,68+ring*24,24+ring*16,ring*.25,0,Math.PI*2);c.stroke();for(let p=0;p<3;p++){const a=t*(ring%2?-.8:.65)*(1+power)+ring+p*Math.PI*2/3;dot(c,150+Math.cos(a)*(68+ring*24),y+Math.sin(a)*(24+ring*16),col,.6+.4*power,5);}}}
      for(let k=0;k<8;k++){const[x,y]=edge(t*.065+k/8,5,173,290,594);dot(c,x,y,palette[k%6],.5+.5*power,4);}
    }else if(style==='pixel'){
      for(const top of [22,799])for(let y=0;y<8;y++)for(let x=0;x<18;x++){const wave=frac(Math.hypot(x-8.5,y-3.5)/8-t*.6),p=.15+(.25+.6*power)*Math.exp(-(((wave-.5)/.24)**2));dot(c,22+x*15,top+y*15,palette[(Math.floor(x/3)+Math.floor(y/2))%6],p,7);}
      for(let side=0;side<2;side++)for(let j=0;j<35;j++)dot(c,side?296:4,198+j*16,palette[j%6],.2+.65*power*(.5+.5*Math.sin(t*4*Math.PI-j*.4))**3,4);
    }else if(style==='spectrum'){
      for(let k=0;k<16;k++){const amount=bands?.[k]||0,col=palette[Math.floor(k/3)%6],h=13+amount*102;for(const y of [148,920]){for(let n=0;n<h/7;n++){c.fillStyle=alpha(col,.3+.55*(power*.6+.4));c.fillRect(18+k*17,y-n*7,11,4);}dot(c,23+k*17,y-h,col,.5+.5*power,4);}}
      for(let side=0;side<2;side++)for(let j=0;j<36;j++){const amount=bands?.[(Math.floor(j/3)+side*6)%16]||0;dot(c,side?296:4,188+j*16,palette[j%6],.2+amount*(.3+.5*power),4);}
      for(const y of [16,790])line(c,[[18,y],[282,y]],palette[4],2,.3+.5*power*pulse);
    }else if(style==='mirrorball'){
      for(const y of [83,858]){
        glow(c,150,y,230,palette[4],.15+.4*power);line(c,[[150,y-72],[150,y-61]],'#9cabc2',1,.5);
        const R=61;
        for(let row=0;row<10;row++){
          const lat=-Math.PI/2+(row+.5)*Math.PI/10,yy=y+Math.sin(lat)*R,ring=Math.cos(lat)*R;
          for(let k=0;k<18;k++){const a=k*Math.PI*2/18+t*.8,depth=Math.cos(a);if(depth<=0)continue;const x=150+Math.sin(a)*ring,ww=Math.max(1,Math.cos(a)*ring*Math.PI*2/18-1),hh=10*Math.cos(lat)+2;
            const spec=Math.max(0,Math.cos(a-.6))**15*(.5+.5*Math.sin(row*1.3+t*4))**2,base=palette[(row+k)%6],tint=blend(base,'#ffffff',spec*.75);c.fillStyle=alpha(tint,.2+depth*.35+spec*(.15+.25*power));c.fillRect(x-ww/2,yy-hh/2,ww,hh);
          }
        }
        for(let k=0;k<14;k++){const a=k*Math.PI/7+t*.25,x=150+Math.cos(a)*(93+12*Math.sin(k)),yy=y+Math.sin(a)*69,p=(.5+.5*Math.sin(t*4+k*2.3))**8;line(c,[[x-4,yy],[x+4,yy]],palette[k%6],1.2,p*(.2+.8*power));line(c,[[x,yy-4],[x,yy+4]],palette[k%6],1.2,p*(.2+.8*power));}
      }
      for(let k=0;k<10;k++){const[x,y]=edge(-t*.045+k/10,5,174,290,592);dot(c,x,y,palette[k%6],.25+.6*power,4);}
    }
    const winnerColor=blend(palette[4],team,settle);
    rr(c,9,330,282,280,9,winnerColor,power?2.5:1,.25+.65*power*(.6+.4*pulse));
    if(power)for(const[x,y]of[[10,331],[290,331],[10,609],[290,609]])glow(c,x,y,60,winnerColor,.45+.45*pulse);
    for(const side of [0,1]){const x=side?296:4;c.fillStyle=power?'#f7faff':'#91a5b8';c.beginPath();c.moveTo(x+(side?-5:5),CY);c.lineTo(x+(side?2:-2),CY-7);c.lineTo(x+(side?2:-2),CY+7);c.closePath();c.fill();}
  }
  return{back,front};
}
module.exports={createLighting};
