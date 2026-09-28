const fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {createHash}=require('node:crypto');
const {createCanvas,loadImage}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const {createCabinet}=require('./cabinet.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const variant=args.variant||'surge';
const variants={surge:{name:'Circuit-Surge'},prism:{name:'Prism-Wave'},supernova:{name:'Disco-Supernova'}};
const config=variants[variant];if(!config)throw Error('Unknown cabinet');
config.landings=[10,10,10,10,10,10];
const W=1920,H=1080,FPS=60,DURATION=15,P=288,STEP=300,CW=296,VIEW_TOP=244,VIEW_H=600;
const teams=[['Yellow','#F5CE19',15,'neon'],['Red','#E8414A',25,'prism'],['Green','#38AA6A',43,'orbit'],['Pink','#F184B6',67,'pixel'],['Blue','#348DDB',89,'spectrum'],['Purple','#955BCD',107,'mirrorball']];
const inventory=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../headshot-slot-reel-2026-09-26/headshots.json')));
const AUDIO=path.resolve(__dirname,'../../outputs/MIT-2.009-Unified-Slot-Disco-D-2026-09-28/MIT-2.009-Disco-D-Full-Row-Hit-120BPM-15s.m4a');
const OUT=path.resolve(__dirname,'../../outputs/MIT-2.009-Unified-Slot-Disco-D-2026-09-28');
const REVIEW=path.join(__dirname,'review');fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(REVIEW,{recursive:true});
const slug=`MIT-2.009-Unified-Slot-${config.name}-Disco-D-15s`;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function random(seed){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function shuffled(xs,seed){const rng=random(seed);return xs.map(p=>({p,r:rng()})).sort((a,b)=>a.r-b.r).map(x=>x.p);}
const targets=new Set(teams.map(t=>t[2]));
const bases=Array.from({length:6},()=>[]);
const distributed=shuffled(inventory.photos.filter(p=>!targets.has(p.number)),28092026);
distributed.forEach((p,i)=>bases[i%6].push(p));
const reels=teams.map(([team,color,target,style],i)=>{
  const winner=inventory.photos.find(p=>p.number===target);if(!winner||winner.team!==team)throw Error('Incorrect team winner');
  const selected=bases[i].slice();
  for(const p of shuffled(inventory.photos,3000+i))if(selected.length<29&&p.number!==target&&!selected.some(q=>q.number===p.number))selected.push(p);
  let order;
  for(let attempt=0;attempt<1000;attempt++){
    const candidate=shuffled(selected,999+i*1000+attempt);
    if(candidate.every((p,k)=>!k||p.team!==candidate[k-1].team)&&candidate.at(-1).team!==team){order=candidate;break;}
  }
  if(!order){
    const remaining=selected.slice();order=[];
    while(remaining.length){let k=remaining.findIndex(p=>p.team!==order.at(-1)?.team);if(k<0)k=0;order.push(remaining.splice(k,1)[0]);}
  }
  order.push(winner);
  return {team,color,target,style,photos:order,landing:config.landings[i]};
});
if(new Set(reels.flatMap(r=>r.photos.map(p=>p.number))).size!==108)throw Error('Every approved student must appear across the six reels');
if(inventory.photos.some(p=>p.number===60))throw Error('Removed photo is present');
for(const p of inventory.photos)if(createHash('sha256').update(fs.readFileSync(p.source)).digest('hex')!==p.sha256)throw Error('Source image changed: '+p.filename);
function position(t,landing){
  const intro=.2,accel=.65,decel=3.7,settle=.65,overshoot=.072,distance=29;
  const cruise=landing-intro-accel-decel-settle;
  const speed=(distance+overshoot)/(.5*accel+cruise+decel/4);
  t-=intro;if(t<=0)return 0;
  if(t<accel)return speed*(t/2-accel*Math.sin(Math.PI*t/accel)/(2*Math.PI));
  t-=accel;const a=speed*accel/2;
  if(t<cruise)return a+speed*t;
  t-=cruise;if(t<decel)return a+speed*cruise+speed*decel/4*(1-(1-t/decel)**4);
  t-=decel;
  const knots=[[0,overshoot],[.17,-.025],[.35,.008],[.49,-.002],[settle,0]];
  for(let k=1;k<knots.length;k++)if(t<knots[k][0]){const[ta,ya]=knots[k-1],[tb,yb]=knots[k];return distance+ya+(yb-ya)*smooth((t-ta)/(tb-ta));}
  return distance;
}
const bands=JSON.parse(fs.readFileSync(path.join(__dirname,'music-bands.json')));
(async()=>{
  const tiles=new Map();
  for(const p of inventory.photos){const im=await loadImage(p.source);if(im.width!==im.height)throw Error('Portrait is not square');const c=createCanvas(P,P),q=c.getContext('2d');q.imageSmoothingQuality='high';q.beginPath();q.roundRect(0,0,P,P,7);q.clip();q.drawImage(im,0,0,P,P);tiles.set(p.number,c);}
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  const reelLayer=createCanvas(CW,VIEW_H),rctx=reelLayer.getContext('2d');
  const cabinet=createCabinet(variant);
  const base=createCanvas(W,H),b=base.getContext('2d');
  const sky=b.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0b1320');sky.addColorStop(.5,'#030609');sky.addColorStop(1,'#10141d');b.fillStyle=sky;b.fillRect(0,0,W,H);
  function frame(t){
    ctx.drawImage(base,0,0);
    const band=bands[Math.min(bands.length-1,Math.floor(t*FPS))];
    cabinet.back(ctx,t,band);
    for(let i=0;i<6;i++){
      const r=reels[i],x=72+i*296,win=t-r.landing;
      ctx.save();ctx.translate(x,0);
      rctx.clearRect(0,0,CW,VIEW_H);
      const speed=Math.abs(position(t+1/120,r.landing)-position(Math.max(0,t-1/120),r.landing))*60;
      const samples=speed>1.5?3:1;rctx.globalCompositeOperation='lighter';rctx.globalAlpha=1/samples;
      for(let k=0;k<samples;k++){
        const tt=Math.max(0,t+(samples===1?0:((k+.5)/samples-.5)/FPS*.4)),pos=position(tt,r.landing);
        for(let j=Math.floor(pos)-2;j<=Math.ceil(pos)+2;j++){
          const y=VIEW_H/2+(pos-j)*STEP-P/2;
          if(y>VIEW_H||y+P<0)continue;
          const photo=r.photos[((j%r.photos.length)+r.photos.length)%r.photos.length];rctx.drawImage(tiles.get(photo.number),4,y);
        }
      }
      rctx.globalAlpha=1;rctx.globalCompositeOperation='source-over';
      ctx.save();ctx.beginPath();ctx.rect(0,VIEW_TOP,CW,VIEW_H);ctx.clip();ctx.drawImage(reelLayer,0,VIEW_TOP);ctx.restore();
      ctx.restore();
    }
    cabinet.front(ctx,t,band);
  }
  const metadata={variant:config.name,file:slug+'.mp4',width:W,height:H,fps:FPS,seconds:DURATION,audio:'Disco D — Full Row Hit',audioSource:AUDIO,audioUnchanged:false,sharedSoundtrack:true,unifiedCabinet:true,photo_count:108,one_winner_per_team:true,columns:reels.map(r=>({team:r.team,target:r.target,style:config.name,landing:r.landing,photos:r.photos.map(p=>({number:p.number,team:p.team,filename:p.filename,sha256:p.sha256}))})),all_winners_settled_at:10,source_photos_unchanged:true};
  if(args.stills==='true'){for(const t of [0,3,9.8,10,10.25,10.6,11.5,13,14.98]){frame(t);fs.writeFileSync(path.join(REVIEW,`${variant}-${t.toFixed(2)}.jpg`),canvas.toBuffer('image/jpeg'));}fs.writeFileSync(path.join(REVIEW,variant+'-details.json'),JSON.stringify(metadata,null,2));return;}
  const log=fs.openSync(path.join(__dirname,variant+'.log'),'w');
  const ff=spawn('/opt/homebrew/bin/ffmpeg',['-hide_banner','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(FPS),'-i','pipe:0','-i',AUDIO,'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,setsar=1,format=yuv420p','-c:v','libx264','-preset','fast','-crf','18','-threads','3','-profile:v','high','-level:v','4.2','-maxrate','24M','-bufsize','48M','-g','120','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','copy','-t','15','-frames:v','900','-movflags','+faststart',path.join(OUT,slug+'.mp4')],{stdio:['pipe','ignore',log]});
  const done=once(ff,'close');ff.stdin.on('error',e=>{if(e.code!=='EPIPE')throw e;});
  for(let f=0;f<900;f++){frame(f/FPS);if(f===660)fs.writeFileSync(path.join(OUT,variant+'-poster.jpg'),canvas.toBuffer('image/jpeg'));if(!ff.stdin.write(Buffer.from(ctx.getImageData(0,0,W,H).data.buffer)))await once(ff.stdin,'drain');if(f%180===0)console.log(`${variant}: ${f}/900`);}
  ff.stdin.end();const[code]=await done;if(code!==0)throw Error('Video encoding failed');
  fs.writeFileSync(path.join(OUT,variant+'-details.json'),JSON.stringify(metadata,null,2)+'\n');console.log('FINISHED '+path.join(OUT,slug+'.mp4'));
})().catch(e=>{console.error(e);process.exitCode=1;});
