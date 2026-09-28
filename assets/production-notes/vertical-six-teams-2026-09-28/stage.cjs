const {createCanvas}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const colors=['#ffda36','#ff5267','#45e89b','#ff94d5','#48baff','#b78bff'];
const clamp=x=>Math.min(1,Math.max(0,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},frac=x=>x-Math.floor(x);
const alpha=(c,a)=>c+Math.round(clamp(a)*255).toString(16).padStart(2,'0');
function fill(c,x,y,w,h,r,col){c.fillStyle=col;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function line(c,pts,col,w=2,a=1){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();}
function rr(c,x,y,w,h,r,col,width=1,a=1){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
const sprites=new Map();
function glow(c,x,y,r,col,a=1){
  if(!sprites.has(col)){const s=createCanvas(80,80),q=s.getContext('2d'),g=q.createRadialGradient(40,40,0,40,40,40);g.addColorStop(0,alpha(col,.9));g.addColorStop(.15,alpha(col,.6));g.addColorStop(.55,alpha(col,.13));g.addColorStop(1,alpha(col,0));q.fillStyle=g;q.fillRect(0,0,80,80);sprites.set(col,s);}
  c.save();c.globalAlpha=a;c.globalCompositeOperation='screen';c.drawImage(sprites.get(col),x-r/2,y-r/2,r,r);c.restore();
}
function edge(u){let d=frac(u)*2*(984+1734);if(d<984)return[48+d,99];d-=984;if(d<1734)return[1032,99+d];d-=1734;if(d<984)return[1032-d,1833];return[48,1833-(d-984)];}
function hue(t){return colors[t<1.5?0:t<3?1:t<4.5?2:t<6?3:t<8?4:5];}
function createStage(variant){
  const base=createCanvas(1080,1920),b=base.getContext('2d'),sky=b.createLinearGradient(0,0,0,1920);
  sky.addColorStop(0,'#0a1425');sky.addColorStop(.6,'#020711');sky.addColorStop(1,'#142134');b.fillStyle=sky;b.fillRect(0,0,1080,1920);
  const metal=b.createLinearGradient(0,80,0,1860);metal.addColorStop(0,'#91a7bc');metal.addColorStop(.035,'#26374d');metal.addColorStop(.49,'#111f32');metal.addColorStop(.53,'#5e738b');metal.addColorStop(.96,'#203348');metal.addColorStop(1,'#8197af');
  fill(b,30,82,1020,1774,47,metal);fill(b,40,92,1000,1754,40,'#020815');
  const fascia=b.createLinearGradient(0,100,1080,1840);fascia.addColorStop(0,'#102440');fascia.addColorStop(.5,'#030c1b');fascia.addColorStop(1,'#10203a');
  fill(b,59,115,962,1708,28,fascia);rr(b,61,117,958,1704,28,'#6883a0',1,.25);
  function emptyCell(c,r){fill(c,r.x,r.y,r.w,r.h,8,'#02060d');rr(c,r.x,r.y,r.w,r.h,8,'#6b819a',1,.3);}
  function back(c,t){
    c.drawImage(base,0,0);
    const won=t>=10,u=Math.max(0,t-10),power=won?1:0;
    for(let i=0;i<6;i++)glow(c,i%2?1045:35,200+i*290,400,won?colors[i]:hue(t),.18+power*.4);
    if(variant==='grid'||t>=10){fill(c,68,244,944,1440,12,'#00050c');}
    else if(variant==='collector'){
      const expand=smooth((t-9.2)/.8);
      c.save();c.globalAlpha=1-expand;fill(c,90,158,900,938,14,'#00050c');c.restore();
    }else{
      const expand=smooth((t-9.2)/.8);c.save();c.globalAlpha=1-expand;
      for(const y of [165,995])fill(c,102,y,876,792,14,'#00050c');c.restore();
    }
  }
  function front(c,t,gridRect){
    const won=t>=10,u=Math.max(0,t-10),pulse=(.5+.5*Math.cos(4*Math.PI*t))**3,hit=won?Math.exp(-u*2.3):0;
    const expand=smooth((t-9.2)/.8),showGrid=variant==='grid'?1:smooth((t-9.93)/.07);
    const col=hue(t);
    for(let k=0;k<170;k++){
      const[x,y]=edge(k/170),color=won?colors[Math.floor(k/29)%6]:col,p=.18+.3*(.5+.5*Math.sin(k*.18-t*3))**4+(won?.25+.2*pulse:0);
      fill(c,x-3,y-3,6,6,1.5,alpha(color,p));if(won&&k%4===0)glow(c,x,y,54,color,p*.5);
    }
    // One common light bar across the top and bottom of the cabinet.
    for(const y of [139,1807])for(let lane=0;lane<3;lane++){
      const yy=y+(lane-1)*11;line(c,[[84,yy],[996,yy]],won?colors[lane*2]:col,1,.22);
      for(let j=0;j<5;j++){
        const x=90+frac(t*.11+j/5+lane*.07)*900,color=won?colors[(j+lane)%6]:col;
        line(c,[[Math.max(84,x-45),yy],[x,yy]],color,3,won?.85:.55);glow(c,x,yy,100,color,won?.7:.28);
      }
    }
    if(showGrid>0){
      rr(c,67,243,946,1442,13,'#aec4da',1.5,.4*showGrid);
      line(c,[[540,249],[540,1680]],'#152a40',8,showGrid);
      for(const y of [729,1205])line(c,[[73,y],[1007,y]],'#152a40',8,showGrid);
      if(won)for(let i=0;i<6;i++){
        const r=gridRect(i),x=r.x+(r.w-r.p)/2,y=r.y+(r.h-r.p)/2;
        rr(c,x-2,y-2,r.p+4,r.p+4,8,colors[i],3,.75+.2*pulse);
        for(const [xx,yy]of[[x,y],[x+r.p,y],[x,y+r.p],[x+r.p,y+r.p]])glow(c,xx,yy,90,colors[i],.35+.35*pulse);
      }
    }
    if(t<10&&variant==='collector'){
      const local=t%1.6,fly=t<8?smooth((local-1.20)/.38):0,a=(1-smooth((t-9.2)/.2))*(1-fly);
      rr(c,92,160,896,934,13,col,2,.5*a);
      for(const[x,d]of[[83,1],[997,-1]]){c.save();c.globalAlpha=a;c.fillStyle=alpha(col,.6);c.beginPath();c.moveTo(x+d*12,627);c.lineTo(x-d*3,618);c.lineTo(x-d*3,636);c.closePath();c.fill();c.restore();}
    }
    if(t<10&&variant==='pairs')for(const y of [165,995])rr(c,102,y,876,792,13,col,2,.55*(1-smooth((t-9.2)/.2)));
    if(!won)return;
    // Large rainbow impact around the six faces. The photo centers stay clear.
    c.save();c.beginPath();c.rect(0,0,1080,1920);
    for(let i=0;i<6;i++){const r=gridRect(i);c.rect(r.x+(r.w-r.p)/2+8,r.y+(r.h-r.p)/2+8,r.p-16,r.p-16);}
    c.clip('evenodd');c.globalCompositeOperation='screen';
    for(let k=0;k<24;k++){
      const a=k*Math.PI/12+u*.10,color=colors[k%6];
      line(c,[[540+Math.cos(a)*140,960+Math.sin(a)*240],[540+Math.cos(a)*1700,960+Math.sin(a)*2500]],color,k%3?5:16,.14+.23*pulse+hit*.18);
    }
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3+u*.2,r=420+u*35;
      glow(c,540+Math.cos(a)*r,960+Math.sin(a)*r*1.5,950,colors[k],.32+.25*pulse);
    }
    for(let k=0;k<5;k++){
      const r=frac(u*.58+k/5)*1400;c.strokeStyle=alpha(colors[k],(1-r/1400)*.7);c.lineWidth=4;
      c.beginPath();c.ellipse(540,960,r,r*1.45,0,0,Math.PI*2);c.stroke();
    }
    if(u<1.25)for(let k=0;k<6;k++){
      const r=100+smooth(u/1.25)*1600+k*15;c.strokeStyle=alpha(colors[k],(1-u/1.25)*.9);c.lineWidth=10+hit*18;c.beginPath();c.ellipse(540,960,r,r*1.45,0,0,Math.PI*2);c.stroke();
    }
    c.restore();
  }
  return{back,front,emptyCell};
}
module.exports={createStage};
