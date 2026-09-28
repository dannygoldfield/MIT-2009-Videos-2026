const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{once}=require('node:events'),{createHash}=require('node:crypto');
const {createCanvas,loadImage}=require('/Users/dannygoldfield/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const {motion,position}=require('./motion.cjs');
const {createStage}=require('./stage.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const variant=args.variant||'grid';
const configs={grid:{name:'Six-Window-Machine',title:'Six-window machine'},collector:{name:'One-Reel-Builds-Six',title:'One reel builds six'},pairs:{name:'Two-Reels-Three-Rounds',title:'Two reels, three rounds'}};
const config=configs[variant];assert(config,'Unknown layout');
const W=1080,H=1920,FPS=60,DURATION=15;
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'outputs/MIT-2.009-Vertical-Six-Teams-2026-09-28');
const REVIEW=path.join(__dirname,'review');fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(REVIEW,{recursive:true});
const AUDIO=path.join(ROOT,'outputs/MIT-2.009-Unified-Slot-Disco-D-2026-09-28/MIT-2.009-Disco-D-Full-Row-Hit-120BPM-15s.m4a');
const slug=`MIT-2.009-Vertical-${config.name}-Disco-D-15s`;
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'work/headshot-slot-reel-2026-09-26/headshots.json')));
const byId=new Map(inventory.photos.map(p=>[p.number,p]));
const teamNames=['Yellow','Red','Green','Pink','Blue','Purple'],targets=[15,25,43,67,89,107];
targets.forEach((id,i)=>assert.equal(byId.get(id).team,teamNames[i]));
assert(!byId.has(60));
for(const p of inventory.photos)assert.equal(createHash('sha256').update(fs.readFileSync(p.source)).digest('hex'),p.sha256);
const clamp=x=>Math.min(1,Math.max(0,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=(a,b,u)=>a+(b-a)*u;
const mixRect=(a,b,u)=>Object.fromEntries(['x','y','w','h','p'].map(k=>[k,lerp(a[k],b[k],u)]));
const gridRect=i=>({x:76+(i%2)*472,y:252+Math.floor(i/2)*476,w:456,h:472,p:450});
const miniRect=i=>({x:302+(i%2)*248,y:1118+Math.floor(i/2)*242,w:228,h:228,p:228});
const hero={x:98,y:166,w:884,h:922,p:844};
const pairRect=i=>({x:110,y:i?1003:173,w:860,h:776,p:756});
function seeded(seed){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function shuffled(arr,seed){const r=seeded(seed);return arr.map(p=>({p,v:r()})).sort((a,b)=>a.v-b.v).map(x=>x.p);}
function chooseSequence(target,n,seed){
  const pool=shuffled(inventory.photos.filter(p=>!targets.includes(p.number)),seed),chosen=[];
  while(chosen.length<n){let k=pool.findIndex(p=>p.team!==chosen.at(-1)?.team);if(k<0)k=0;chosen.push(pool.splice(k,1)[0]);}
  chosen.push(byId.get(target));return chosen;
}
const old=JSON.parse(fs.readFileSync(path.join(ROOT,'outputs/MIT-2.009-Unified-Slot-Independent-2026-09-28/surge-details.json')));
const gridReels=old.columns.map((r,i)=>({photos:r.photos.map(p=>byId.get(p.number)),motion:motion[i],target:targets[i],team:teamNames[i]}));
const collectReels=targets.map((target,i)=>({photos:chooseSequence(target,i===5?7:4,80926+i),motion:{intro:.02,accel:.14,decel:i===5?.78:.35,settle:i===5?.28:.18,distance:i===5?7:4,landing:i===5?2:1.05,overshoot:.06,ripple:.05},start:i*1.6,target,team:teamNames[i]}));
const pairReels=[0,1].map(lane=>{
  const starts=lane?[0,2.98,6.26]:[0,2.63,5.98];
  const ends=lane?[2.35,5.6,10]:[2.0,5.25,9.78];
  const photos=[],segments=[];
  for(let round=0;round<3;round++){
    const target=targets[round*2+lane],dist=round===2?11:8;
    const list=chooseSequence(target,dist,2090+lane*100+round);
    const offset=photos.length?photos.length-1:0;
    if(photos.length)photos.push(...list.slice(1));else photos.push(...list);
    const travel=round?list.length-1:list.length-1;
    const m={intro:.015,accel:.24+lane*.06,decel:.72+round*.12,settle:.24+lane*.05,distance:travel,landing:ends[round]-starts[round],overshoot:.085,ripple:.10};
    segments.push({start:starts[round],end:ends[round],offset,motion:m,target});
    assert.equal(photos[offset+travel].number,target);
  }
  return {photos,segments,lane};
});
function pairPosition(t,r){
  let pos=0;for(const s of r.segments){if(t<s.start)break;pos=s.offset+position(t-s.start,s.motion);}return pos;
}
const active=variant==='grid'?gridReels:variant==='collector'?collectReels:pairReels;
const used=new Map(active.flatMap(r=>r.photos).map(p=>[p.number,p]));
targets.forEach(id=>used.set(id,byId.get(id)));
if(variant==='grid')assert.equal(used.size,108);
for(const r of collectReels){assert(r.motion.landing-r.motion.intro-r.motion.accel-r.motion.decel-r.motion.settle>0);assert.equal(position(3,r.motion),r.photos.length-1);}
for(const r of pairReels)for(const s of r.segments)assert(s.motion.landing-s.motion.intro-s.motion.accel-s.motion.decel-s.motion.settle>0);
(async()=>{
  const tiles=new Map(),S=variant==='grid'?480:860;
  for(const p of used.values()){const im=await loadImage(p.source);assert.equal(im.width,im.height);const c=createCanvas(S,S),q=c.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(im,0,0,S,S);tiles.set(p.number,c);}
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d'),stage=createStage(variant);
  const layer=createCanvas(1000,1000),q=layer.getContext('2d');
  function photo(id,rect,a=1){
    ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.roundRect(rect.x+(rect.w-rect.p)/2,rect.y+(rect.h-rect.p)/2,rect.p,rect.p,7);ctx.clip();ctx.drawImage(tiles.get(id),rect.x+(rect.w-rect.p)/2,rect.y+(rect.h-rect.p)/2,rect.p,rect.p);ctx.restore();
  }
  function reel(r,rect,t,posFn){
    // Render to a reusable local surface; temporal samples soften fast movement.
    const width=Math.ceil(rect.w),height=Math.ceil(rect.h),P=rect.p,step=P*1.026;
    q.clearRect(0,0,1000,1000);
    const fn=posFn||((tt)=>position(tt,r.motion));
    const speed=Math.abs(fn(t+1/120)-fn(Math.max(0,t-1/120)))*60;
    const samples=speed>1.8?3:1;q.globalCompositeOperation='lighter';q.globalAlpha=1/samples;
    for(let k=0;k<samples;k++){
      const tt=Math.max(0,t+(samples===1?0:((k+.5)/samples-.5)/FPS*.42)),pos=fn(tt);
      for(let j=Math.floor(pos)-2;j<=Math.ceil(pos)+2;j++){
        const y=height/2+(pos-j)*step-P/2;if(y>height||y+P<0)continue;
        const p=r.photos[((j%r.photos.length)+r.photos.length)%r.photos.length];q.drawImage(tiles.get(p.number),(width-P)/2,y,P,P);
      }
    }
    q.globalAlpha=1;q.globalCompositeOperation='source-over';
    // Curved-reel falloff outside the central square, preserving the entire winner.
    const fade=q.createLinearGradient(0,0,0,height),edge=(height-P)/2/height;
    fade.addColorStop(0,'#000712c4');fade.addColorStop(Math.max(.005,edge),'#00071200');fade.addColorStop(Math.min(.995,1-edge),'#00071200');fade.addColorStop(1,'#000712c4');
    q.fillStyle=fade;q.fillRect(0,0,width,height);
    ctx.save();ctx.beginPath();ctx.roundRect(rect.x,rect.y,rect.w,rect.h,8);ctx.clip();ctx.drawImage(layer,0,0,width,height,rect.x,rect.y,rect.w,rect.h);ctx.restore();
  }
  function finalGrid(t){for(let i=0;i<6;i++)photo(targets[i],gridRect(i));}
  function frame(t){
    stage.back(ctx,t);
    if(variant==='grid'){
      for(let i=0;i<6;i++)reel(gridReels[i],gridRect(i),t);
    }else if(variant==='collector'){
      const expand=smooth((t-9.2)/.8);
      if(t>=10)finalGrid(t);
      else if(t>=9.2){
        for(let i=0;i<5;i++)photo(targets[i],mixRect(miniRect(i),gridRect(i),expand));
        reel(collectReels[5],mixRect(hero,gridRect(5),expand),t-8);
      }else{
        const index=Math.min(5,Math.floor(t/1.6)),r=collectReels[index],local=t-r.start;
        for(let i=0;i<index;i++)photo(targets[i],miniRect(i));
        for(let i=index;i<6;i++)stage.emptyCell(ctx,miniRect(i));
        if(index<5&&local>=1.20){
          const u=smooth((local-1.20)/.38);photo(r.target,mixRect(hero,miniRect(index),u));
        }else reel(r,hero,local);
      }
    }else{
      const expand=smooth((t-9.2)/.8);
      if(t>=10)finalGrid(t);
      else if(t>=9.2){
        for(let i=0;i<4;i++)photo(targets[i],gridRect(i),expand);
        for(let i=0;i<2;i++)reel(pairReels[i],mixRect(pairRect(i),gridRect(4+i),expand),t,tt=>pairPosition(tt,pairReels[i]));
      }else for(let i=0;i<2;i++)reel(pairReels[i],pairRect(i),t,tt=>pairPosition(tt,pairReels[i]));
    }
    stage.front(ctx,t,gridRect);
  }
  const metadata={variant,title:config.title,file:slug+'.mp4',width:W,height:H,fps:FPS,seconds:DURATION,audio:'Disco D — Full Row Hit',audioSource:AUDIO,sharedSoundtrack:true,noVisibleText:true,photo_count:used.size,one_winner_per_team:true,targets:targets.map((id,i)=>({number:id,team:teamNames[i],filename:byId.get(id).filename,sha256:byId.get(id).sha256})),photos:[...used.values()].map(p=>({number:p.number,team:p.team,sha256:p.sha256})),complete_grid_at:10,celebration_seconds:5,source_photos_unchanged:true,layout:config.title,sequences:active.map(r=>({photos:r.photos.map(p=>p.number),motion:r.motion,segments:r.segments,start:r.start}))};
  if(args.stills==='true'){
    for(const t of [0,1.3,2.4,4.1,5.8,7.5,9.4,10,10.35,11.5,14.9]){frame(t);fs.writeFileSync(path.join(REVIEW,`${variant}-${t.toFixed(2)}.jpg`),canvas.toBuffer('image/jpeg'));}
    fs.writeFileSync(path.join(REVIEW,variant+'-details.json'),JSON.stringify(metadata,null,2));return;
  }
  const log=fs.openSync(path.join(__dirname,variant+'.log'),'w');
  const ff=spawn('/opt/homebrew/bin/ffmpeg',['-hide_banner','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate','60','-i','pipe:0','-i',AUDIO,'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,setsar=1,format=yuv420p','-c:v','libx264','-preset','fast','-crf','18','-threads','3','-profile:v','high','-level:v','4.2','-maxrate','24M','-bufsize','48M','-g','120','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','copy','-t','15','-frames:v','900','-movflags','+faststart',path.join(OUT,slug+'.mp4')],{stdio:['pipe','ignore',log]});
  const done=once(ff,'close');ff.stdin.on('error',e=>{if(e.code!=='EPIPE')throw e;});
  for(let f=0;f<900;f++){frame(f/FPS);if(f===(variant==='grid'?690:348))fs.writeFileSync(path.join(OUT,variant+'-poster.jpg'),canvas.toBuffer('image/jpeg'));if(!ff.stdin.write(Buffer.from(ctx.getImageData(0,0,W,H).data.buffer)))await once(ff.stdin,'drain');if(f%180===0)console.log(`${variant}: ${f}/900`);}
  ff.stdin.end();const[code]=await done;assert.equal(code,0,'Encoding failed');
  fs.writeFileSync(path.join(OUT,variant+'-details.json'),JSON.stringify(metadata,null,2)+'\n');console.log('FINISHED '+path.join(OUT,slug+'.mp4'));
})().catch(e=>{console.error(e);process.exitCode=1;});
