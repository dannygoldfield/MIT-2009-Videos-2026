"""Build the requested duration comparison from the approved Pixel/Prism sources."""
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ORIGINAL = HERE.parent / 'headshot-slot-blue-disco-2026-09-26'
OUT = ROOT / 'outputs/MIT-2.009-Pixel-Prism-Duration-Tests-2026-10-03'
OUT.mkdir(parents=True, exist_ok=True)

lights = (ORIGINAL / 'lights.cjs').read_text()
lights = lights.replace('function createLights(mode){', 'function createLights(mode, landing=12){')
lights = lights.replace('colors=accentColors(t);', 'colors=accentColors(Math.min(12,t*12/landing));')
# Use exactly the Prism rays, with the Pixel perimeter and housing. Remove the
# Pixel corner-bracket celebration; the winner outline and glow remain shared.
start = lights.index('      if(power){\n        // Six-color rays')
end = lights.index("    }else if(mode==='orbit')", start)
prism_rays = lights[start:end]
start = lights.index('      if(power){\n        for(let side=0;side<2;side++)for(let row=0;row<24;row++)')
end = lights.index('    }\n    if(power){', start)
lights = lights[:start] + prism_rays + lights[end:]
(HERE / 'lights.cjs').write_text(lights)

render = (ORIGINAL / 'render.cjs').read_text()
render = render.replace("const mode=args.variant||'neon';", "const mode='pixel';")
render = render.replace('DURATION=18;', "DURATION=Number(args.duration||15);\nif(![15,13,11].includes(DURATION))throw Error('Choose 15, 13, or 11 seconds');\nconst LANDING=DURATION-3;")
render = render.replace('const celebrationAt=settledTime;', 'const celebrationAt=LANDING;')
render = render.replace('function position(t){', 'function originalPosition(t){')
render = render.replace("const OUT=path.resolve(__dirname,'../../outputs/MIT-2.009-Blue-Digital-Slots-Disco-D-2026-09-26');", "function position(t){return originalPosition(t*12/LANDING);}\nconst OUT=path.resolve(__dirname,'../../outputs/MIT-2.009-Pixel-Prism-Duration-Tests-2026-10-03');")
render = render.replace("const REVIEW=path.join(__dirname,'review');", "const REVIEW=path.join(__dirname,'review',String(DURATION));")
render = render.replace('const slug=`MIT-2.009-Blue-Digital-Slot-${names[mode]}-Disco-D-18s`;', 'const slug=`MIT-2.009-Blue-Pixel-Prism-Disco-D-${DURATION}s`;')
render = render.replace("const AUDIO='/Users/dannygoldfield/Projects/MIT-2009-Videos-2026/assets/videos/MIT-2.009-Neon-Circuit-Disco-Space-Disco-18s.mp4';", "const AUDIO=path.join(OUT,`Disco-D-${DURATION}s.m4a`);")
render = render.replace('const lights=createLights(mode);', 'const lights=createLights(mode,LANDING);')
render = render.replace('const stillTimes=[0,.8,3,9,11.3,12,12.6,13.4,14.2,15,16,17.98];', 'const stillTimes=[0,LANDING*.25,LANDING*.75,LANDING-.5,LANDING,LANDING+.6,LANDING+1.5,DURATION-1/60];')
render = render.replace("'-threads','3'", "'-threads','2'")
render = render.replace("'-t','18'", "'-t',String(DURATION)")
render = render.replace("if(f===900)fs.writeFileSync(path.join(OUT,mode+'-poster.jpg')", "if(f===Math.round((LANDING+1.5)*FPS))fs.writeFileSync(path.join(OUT,DURATION+'s-poster.jpg')")
render = render.replace("path.join(OUT,mode+'-details.json')", "path.join(OUT,DURATION+'s-details.json')")
render = render.replace('effect:names[mode]', "effect:'Pixel perimeter + Prism rays'")
render = render.replace('audioUnchanged:true', 'audioUnchanged:false,audioSourceStart:15-DURATION,audioSourceEnd:15,audioTempoBPM:120,audioFadeIn:.015,audioFadeOut:.25')
render = render.replace("accents:'Slowly blend through team colors for 9 seconds, settle into blue from 9 to 12 seconds, remain blue through the finish'", "accents:'Pixel Party perimeter; original team-color transition retimed to the landing; Prism Jackpot rays during the three-second blue finish'")
render = render.replace('stopTime,settledTime,celebrationAt,style:', 'stopTime:stopTime*LANDING/12,settledTime:LANDING,celebrationAt,celebrationSeconds:3,motionTimeScale:12/LANDING,style:')
(HERE / 'render.cjs').write_text(render)

source = ROOT / 'outputs/MIT-2.009-Disco-Beat-Tests-2026-09-26/MIT-2.009-Disco-Space-Disco-120BPM-18s.wav'
for duration in [15,13,11]:
    # Start on the 0/2/4 second downbeat. Every version retains the same original
    # 12–15 second winning phrase, at the original pitch, tempo, and gain.
    wav = OUT / f'Disco-D-{duration}s.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',
                    f'atrim=start={15-duration}:end=15,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.015,afade=t=out:st={duration-.25}:d=0.25',
                    '-c:a','pcm_s24le',str(wav)],check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart',str(OUT/f'Disco-D-{duration}s.m4a')],check=True)
print('Prepared Pixel/Prism hybrid and three aligned Disco D edits.')
