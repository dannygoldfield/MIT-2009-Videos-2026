"""Disco D, 15-second arrangement with a full-row hit at exactly ten seconds."""
from synth import *

mix=Mix(); style=3; transpose=7
kd=kick(3); cp=clap(); sn=snare(); ch=hat(); oh=hat(True); tb=tamb()
for beat in range(29):
    at=beat*.5
    if beat not in [18,19]: mix.add('drums',kd,at,.82 if beat<20 else .98)
    if beat%2 and beat!=19:
        mix.add('drums',cp,at+.009,.45); mix.add('drums',sn,at+.004,.15)
    if beat<28:
        mix.add('drums',oh,at+.25,.23,.25)
        mix.add('drums',ch,at+.005,.10,-.2)
        for sub in [.125,.375]:mix.add('drums',ch,at+sub+.004,.045+RNG.random()*.025,-.4 if sub<.2 else .4)
    if beat>=20:mix.add('drums',tb,at+.25,.13,.55)
for i,at in enumerate([9,9.25,9.5,9.625,9.75]):
    mix.add('drums',sn if i<2 else tom(49-i*2),at,.20+i*.035,(-1)**i*.22)
for bar,chordidx in enumerate([0,1,2,3,3,0,1,0]):
    at=bar*2; root=ROOTS[chordidx]+transpose; notes=[n+transpose for n in CHORDS[chordidx]]
    for off in [0,1.5,2.5]:
        if at+off*.5<14.2:mix.chord(notes,at+off*.5,.6,.26,'keys',-.2)
    mix.chord([n+12 for n in notes],at,1.8,.13,'pad',.4)
    if bar>=2 and bar<7:
        arp=[notes[2]+12,notes[3]+12,notes[1]+24,notes[0]+24]
        for q in range(8):mix.add('lead',keys(arp[q%4],.12),at+q*.25,.075,.4*(-1)**q)
    for off,interval,length in [(0,0,.30),(1.5,12,.20),(2,0,.27),(3,7,.18),(3.5,12,.18)]:
        when=at+off*.5
        if when>=14.2 or 9.5<=when<10:continue
        mix.add('bass',bass(root+interval,length,3),when,.60)
    if bar>=5:mix.chord([n+12 for n in notes],at,.72,.32,'pad')
# The established Space Disco melody, shifted two seconds earlier.
for off,n,length in [(0,88,.55),(1.5,86,.28),(2,84,.50),(3.5,83,.27),(4,81,.75)]:
    mix.add('lead',keys(n+transpose,length),10+off*.5,.22,.07)
mix.chord([64,71,74,79],14,.60,.32,'keys')
t=time(1.7);mix.add('fx',fade(noise(t,3500,10500)*(t/1.7)**2*.045,.1,.02),8.3)
melodic=mix.parts['chords']+mix.parts['lead'];wet=np.zeros((N,2))
for delay,gain in [(.061,.09),(.113,.07),(.187,.06),(.251,.05),(.379,.035)]:
    s=round(delay*RATE);wet[s:]+=melodic[:-s,::-1]*gain
for delay,gain in [(.375,.14),(.75,.065)]:
    s=round(delay*RATE);wet[s:]+=mix.parts['lead'][:-s,::-1]*gain
t=np.arange(N)/RATE;duck=1-.10*np.exp(-np.mod(t,.5)/.075)
audio=mix.parts['drums']+mix.parts['bass']+(melodic+wet)*duck[:,None]+mix.parts['fx']
# A brief inhale makes the shared landing audible without a volume spike.
env=np.ones(N);a,b=round(9.82*RATE),10*RATE
env[a:b]=np.linspace(1,.16,b-a)**1.6
audio*=env[:,None]
hit=Mix();hit.add('drums',cp,10,.70);hit.add('drums',sn,10,.20)
hit.add('drums',cymbal(),10,1.1,.08)
hit.chord([64,67,71,74,79],10,.6,.65,'brass')
hit.chord([76,79,83,86],10,.65,.28,'keys',-.2)
audio+=sum(hit.parts.values())
audio-=audio.mean(axis=0);audio=np.tanh(audio*1.05)/1.05
audio[-round(.30*RATE):]*=np.linspace(1,0,round(.30*RATE))[:,None]
audio*=.9/np.max(np.abs(audio))
raw=OUT/'landing-mix.wav'
with wave.open(str(raw),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(np.rint(audio*32767).astype('<i2').tobytes())
ff='/opt/homebrew/bin/ffmpeg'
def run(args):return subprocess.run(args,capture_output=True,text=True,check=True)
def measure(p):
    s=run([ff,'-hide_banner','-i',str(p),'-af','loudnorm=I=-15:TP=-1.5:LRA=9:print_format=json','-f','null','-']).stderr
    return json.JSONDecoder().raw_decode(s[s.rfind('{'):])[0]
m=measure(raw)
filt='loudnorm=I=-15:TP=-1.5:LRA=9:linear=true:'+':'.join(f'{k}={m[v]}' for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])
base=OUT/'MIT-2.009-Disco-D-Full-Row-Hit-120BPM-15s'
run([ff,'-v','error','-y','-i',str(raw),'-af',filt,'-ar','48000','-c:a','pcm_s24le',str(base)+'.wav'])
for ext,codec,bit in [('mp3','libmp3lame','256k'),('m4a','aac','256k')]:
    run([ff,'-v','error','-y','-i',str(base)+'.wav','-c:a',codec,'-b:a',bit,str(base)+'.'+ext])
measured=measure(str(base)+'.wav')
assert -16<float(measured['input_i'])<-14 and float(measured['input_tp'])<-1
pcm=subprocess.check_output([ff,'-v','error','-i',str(base)+'.wav','-f','f32le','-'])
x=np.frombuffer(pcm,dtype='<f4').reshape(-1,2);assert len(x)==720000
pre=float(np.sqrt(np.mean(x[int(9.93*RATE):10*RATE]**2)))
post=float(np.sqrt(np.mean(x[10*RATE:int(10.07*RATE)]**2)))
assert post>pre*2
details=dict(title='Disco D — Full Row Hit',bpm=120,seconds=15,landing_seconds=10,integrated_lufs=float(measured['input_i']),true_peak_dbtp=float(measured['input_tp']),landing_to_anticipation_rms_ratio=post/pre,composition='Original Space Disco instruments and melody, rearranged for 15 seconds; new drum-and-chord hit at ten seconds. No external samples.')
(OUT/'audio-details.json').write_text(json.dumps(details,indent=2)+'\n')
# Actual soundtrack spectrum, shared by the cabinet light animations.
mono=x.mean(axis=1);window=np.hanning(4096);freq=np.fft.rfftfreq(4096,1/RATE);edges=np.geomspace(40,14000,17)
bands=[]
for frame in range(900):
    start=frame*800-2048;chunk=np.zeros(4096);lo=max(0,start);hi=min(len(mono),start+4096);chunk[lo-start:hi-start]=mono[lo:hi]
    mag=np.abs(np.fft.rfft(chunk*window));bands.append([float(np.sqrt(np.mean(mag[(freq>=edges[k])&(freq<edges[k+1])]**2))) for k in range(16)])
bands=np.log1p(np.array(bands));bands=np.clip(bands/np.percentile(bands,96,axis=0),0,1);last=np.zeros(16);smooth=[]
for row in bands:
    last=last+(row-last)*np.where(row>last,.75,.20);smooth.append(np.round(last,3).tolist())
(Path(__file__).parent/'music-bands.json').write_text(json.dumps(smooth))
raw.unlink();print(json.dumps(details,indent=2))
