const {createCanvas}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const colors=['#ffda36','#ff5267','#45e89b','#ff94d5','#48baff','#b78bff'];
const clamp=x=>Math.max(0,Math.min(1,x)),frac=x=>x-Math.floor(x);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const alpha=(c,a)=>c+Math.round(clamp(a)*255).toString(16).padStart(2,'0');
const blend=(a,b,u)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-u)+parseInt(b.slice(i,i+2),16)*u).toString(16).padStart(2,'0')).join('');
const glows=new Map();
function glow(c,x,y,r,col,a=1){
  if(!glows.has(col)){const s=createCanvas(80,80),q=s.getContext('2d'),g=q.createRadialGradient(40,40,0,40,40,40);g.addColorStop(0,alpha(col,.9));g.addColorStop(.15,alpha(col,.5));g.addColorStop(.5,alpha(col,.12));g.addColorStop(1,alpha(col,0));q.fillStyle=g;q.fillRect(0,0,80,80);glows.set(col,s);}
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=a;c.drawImage(glows.get(col),x-r/2,y-r/2,r,r);c.restore();
}
function line(c,pts,col,w=2,a=1){c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=a;c.lineJoin='round';c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();}
function rr(c,x,y,w,h,r,col,width=1,a=1){c.save();c.strokeStyle=col;c.lineWidth=width;c.globalAlpha=a;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function fill(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function dot(c,x,y,col,p,s=6){c.fillStyle=alpha(col,.12+.88*p);c.beginPath();c.roundRect(x-s/2,y-s/2,s,s,1.5);c.fill();if(p>.6)glow(c,x,y,s*8,col,p*.5);}
function edge(u){let d=frac(u)*2*(1856+960);if(d<1856)return[32+d,60];d-=1856;if(d<960)return[1888,60+d];d-=960;if(d<1856)return[1888-d,1020];return[32,1020-(d-1856)];}
function createCabinet(style){
  const base=createCanvas(1920,1080),b=base.getContext('2d');
  const metal=b.createLinearGradient(0,20,0,1060);
  for(const [p,col] of [[0,'#b5c5d5'],[.025,'#4f6076'],[.07,'#0c1422'],[.45,'#2c394b'],[.53,'#66758a'],[.7,'#172433'],[.95,'#53687b'],[1,'#0d1521']])metal.addColorStop(p,col);
  fill(b,22,38,1876,1004,52,metal);fill(b,32,48,1856,984,44,'#030914');
  const fascia=b.createLinearGradient(0,60,0,1020);fascia.addColorStop(0,style==='prism'?'#15273d':'#0b172c');fascia.addColorStop(.5,'#020710');fascia.addColorStop(1,'#10223b');
  fill(b,45,62,1830,956,35,fascia);rr(b,47,64,1826,952,34,'#afc1d4',1,.27);
  // One continuous glass window; narrow dividers exist only inside that window.
  fill(b,64,234,1792,620,16,'#00030a');rr(b,63,233,1794,622,17,'#c2d1df',2,.65);
  fill(b,65,79,1790,136,21,'#020811');fill(b,65,875,1790,119,20,'#020811');
  line(b,[[78,219],[1842,219]],'#657d97',1,.5);line(b,[[78,870],[1842,870]],'#657d97',1,.5);
  const shade=createCanvas(1776,600),s=shade.getContext('2d'),g=s.createLinearGradient(0,0,0,600);
  g.addColorStop(0,'#02060aef');g.addColorStop(.19,'#02060aad');g.addColorStop(.26,'#02060a00');g.addColorStop(.74,'#02060a00');g.addColorStop(.81,'#02060aad');g.addColorStop(1,'#02060aef');s.fillStyle=g;s.fillRect(0,0,1776,600);
  // Each variety uses a different one-color-at-a-time choreography.
  const colorStops=style==='surge'?[0,1.5,3,4.5,6,8,10]:style==='prism'?[0,2,4,6,7.5,9,10]:[0,1.25,2.5,3.5,4.5,5.5,6.5,7.25,8,8.5,9,9.5,10];
  const colorState=t=>{
    if(t>=10)return {colors,index:6,phase:0};
    const k=Math.max(0,colorStops.findIndex((start,i)=>i<colorStops.length-1&&t>=start&&t<colorStops[i+1]));
    return {colors:Array(6).fill(colors[k%6]),index:k,phase:(t-colorStops[k])/(colorStops[k+1]-colorStops[k])};
  };
  const palette=t=>colorState(t).colors;
  function back(c,t,bands){
    const win=Math.max(0,t-10),p=t>=10?1:0,beat=(.5+.5*Math.cos(4*Math.PI*t))**3;
    // Broad spill outside the single housing makes its shared silhouette obvious.
    for(let i=0;i<6;i++)glow(c,220+i*296,i%2?960:100,800,palette(t)[i],.16+p*(.35+.3*beat));
    if(p){for(let k=0;k<36;k++){const a=k*Math.PI/18+win*.07;line(c,[[960+Math.cos(a)*470,544+Math.sin(a)*210],[960+Math.cos(a)*1700,544+Math.sin(a)*1300]],colors[Math.floor(k/6)%6],k%3?5:18,.10+.15*beat);}}
    c.drawImage(base,0,0);
  }
  function front(c,t,bands){
    const won=t>=10,u=Math.max(0,t-10),on=won?1:0,pulse=(.5+.5*Math.cos(4*Math.PI*t))**3;
    const state=colorState(t),cols=state.colors,hit=won?Math.exp(-u*2.5):0,anticipation=smooth((t-9.65)/.35)*(1-on);
    c.drawImage(shade,72,244);
    for(let i=1;i<6;i++){line(c,[[72+i*296,245],[72+i*296,843]],'#0d1420',5,.9);line(c,[[73+i*296,245],[73+i*296,843]],'#8ba0b5',1,.35);}
    // The winning row is framed once, spanning every reel.
    for(const y of [398,690]){
      let gradient=c.createLinearGradient(72,0,1848,0);cols.forEach((col,i)=>gradient.addColorStop(i/5,col));
      line(c,[[66,y],[1854,y]],gradient,won?5:1,.22+on*(.5+.25*pulse));
      if(won)for(let i=0;i<6;i++)glow(c,220+i*296,y,240,colors[i],.5+.5*pulse);
    }
    for(const [x,dir] of [[49,1],[1871,-1]]){c.fillStyle=won?'#f2f9ff':'#7396bd';c.beginPath();c.moveTo(x+dir*13,544);c.lineTo(x-dir*4,533);c.lineTo(x-dir*4,555);c.closePath();c.fill();}
    // Shared perimeter LEDs run around one case, never around six separate cards.
    for(let k=0;k<204;k++){
      const [x,y]=edge(k/204),col=cols[Math.floor(k/34)%6];
      const chase=(.5+.5*Math.cos(k*.16-t*3))**5;
      dot(c,x,y,col,clamp(.13+.35*chase+on*(.32+.22*pulse)+hit*.4-anticipation*.12),6);
    }
    c.save();c.beginPath();c.rect(65,80,1790,133);c.rect(65,878,1790,115);c.clip();
    if(style==='surge'){
      // Circuit paths join the entire machine to one central power bus.
      for(let lane=0;lane<6;lane++){
        const y=96+lane*17,col=cols[lane],yy=898+lane*14;
        for(const top of [y,yy]){
          const pts=[[80,top+8],[330,top+8],[380,top],[790,top],[850,top+7],[1070,top+7],[1130,top],[1540,top],[1590,top+8],[1840,top+8]];
          line(c,pts,col,1.6,.2+.3*on);
          for(let m=0;m<4;m++){
            const xx=80+frac(t*.12+m/4+lane*.025)*1760;
            line(c,[[xx-85,top],[xx,top]],col,3.8,.65+on*.35);glow(c,xx,top,130,col,.35+on*.5);
          }
        }
      }
      if(won)for(let k=0;k<6;k++){const travel=frac(u*.8+k/6),spread=travel*1200;
        for(const sign of [-1,1])for(const y of [143,936])glow(c,960+sign*spread,y,330,colors[k],(1-travel)*(.65+.35*pulse));}
    }else if(style==='prism'){
      for(const y of [146,936])for(let k=0;k<25;k++){
        const x=85+k*73,col=cols[Math.floor(k/4)%6],h=34+on*(10+14*pulse);
        const sweep=Math.exp(-(((k/24-state.phase)/.18)**2)),q=won?.45+.3*pulse:.12+.75*sweep;
        const pts=[[x-37,y],[x,y-h],[x+37,y],[x,y+h],[x-37,y]];
        c.fillStyle=alpha(col,q*.48);c.beginPath();pts.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();c.fill();line(c,pts,col,1.5,q+.2);line(c,[[x-37,y],[x+37,y]],col,1,q);
        if(won)glow(c,x,y,130,col,.4*(.3+.7*(.5+.5*Math.cos(t*4*Math.PI-k*.45))**3));
      }
    }else{
      // A single wide LED wall, with ripples centered on the machine as a whole.
      for(const [top,rows] of [[87,8],[888,6]])for(let y=0;y<rows;y++)for(let x=0;x<96;x++){
        const xx=80+x*18.5,yy=top+y*15.5,r=Math.hypot((x-47.5)*.12,(y-3.5)*.25),wave=won?(.5+.5*Math.cos(r-t*3))**4:(.5+.5*Math.cos(2*Math.PI*state.phase-r*.14))**2;
        dot(c,xx,yy,cols[Math.floor(x/16)%6],.07+.50*wave+on*(.10+.25*wave),won?7:5);
      }
      for(let k=0;k<64;k++){
        const level=bands?.[k%16]||0,x=86+k*27.5,col=cols[Math.floor(k/11)%6];
        line(c,[[x,982],[x,982-level*(on?90:55)]],col,5,.2+on*.4);
      }
    }
    c.restore();
    if(won){
      // Expanding washes and moving stage beams surround the faces, across the
      // entire width. Smooth beat pulses avoid a full-screen white strobe.
      c.save();c.beginPath();c.rect(0,0,1920,394);c.rect(0,696,1920,384);c.clip();c.globalCompositeOperation='screen';
      if(style==='surge'){
        // Six broad luminous petals open from one common center.
        for(let k=0;k<6;k++){
          const a=k*Math.PI/3-Math.PI/2+u*.10,spread=450+250*smooth(u/.9)+90*Math.sin(u*1.1),col=colors[k];
          const xx=960+Math.cos(a)*spread,yy=544+Math.sin(a)*spread*.65;
          glow(c,xx,yy,900,col,.48+.35*pulse);line(c,[[960,544],[960+Math.cos(a)*1900,544+Math.sin(a)*1500]],col,22,.13+.15*pulse);
        }
      }else if(style==='prism'){
        for(let k=0;k<36;k++){
          const a=k*Math.PI/18+Math.sin(u*.45)*.13,col=colors[Math.floor(k/6)%6];
          c.fillStyle=alpha(col,.08+.12*pulse+hit*.13);c.beginPath();c.moveTo(960,544);c.lineTo(960+Math.cos(a-.026)*2200,544+Math.sin(a-.026)*1600);c.lineTo(960+Math.cos(a+.026)*2200,544+Math.sin(a+.026)*1600);c.closePath();c.fill();
        }
        for(let k=0;k<5;k++){const r=frac(u*.55+k/5)*1600;const pts=[[960-r,544],[960,544-r*.67],[960+r,544],[960,544+r*.67],[960-r,544]];line(c,pts,colors[k],4,(1-r/1600)*.65);}
      }else{
        for(let k=0;k<48;k++){
          const a=k*Math.PI/24+u*.09,col=colors[k%6],r=320+((k*139)%800);
          line(c,[[960+Math.cos(a)*r*.6,544+Math.sin(a)*r*.4],[960+Math.cos(a)*r*2,544+Math.sin(a)*r*1.4]],col,k%5?2:9,.12+.25*pulse);
        }
        for(let k=0;k<7;k++){const r=frac(u*.55+k/7)*1400;c.strokeStyle=alpha(colors[k%6],(1-r/1400)*.5);c.lineWidth=4;c.beginPath();c.ellipse(960,544,r,r*.65,0,0,Math.PI*2);c.stroke();}
      }
      // The impact starts on the exact musical hit, expanding rapidly into the rim.
      if(u<1.25){const radius=180+smooth(u/1.25)*2200;for(let k=0;k<6;k++){
        c.strokeStyle=alpha(colors[k],(1-u/1.25)*.9);c.lineWidth=8+hit*20;c.beginPath();c.ellipse(960,544,radius+k*18,(radius+k*18)*.55,0,0,Math.PI*2);c.stroke();
      }}
      c.restore();
      // Small light flares travel along the shared payline; faces remain readable.
      for(let k=0;k<12;k++){
        const x=80+frac(u*.21+k/12)*1760,y=k%2?695:393,col=colors[k%6];
        glow(c,x,y,130,col,.5+.45*pulse);line(c,[[x-17,y],[x+17,y]],'#e9f7ff',1.5,.5);line(c,[[x,y-9],[x,y+9]],'#e9f7ff',1.5,.5);
      }
    }
  }
  return{back,front};
}
module.exports={createCabinet};
