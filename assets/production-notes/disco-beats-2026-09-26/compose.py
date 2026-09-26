"""Four deterministic original disco sketches. No external audio samples."""
from pathlib import Path
import json, math, wave, subprocess
import numpy as np

RATE=48000
DURATION=18
N=RATE*DURATION
BEAT=.5
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/MIT-2.009-Disco-Beat-Tests-2026-09-26'
OUT.mkdir(parents=True,exist_ok=True)
RNG=np.random.default_rng(20092026)

def time(seconds): return np.arange(round(seconds*RATE))/RATE
def hz(note): return 440*2**((note-69)/12)
def fade(x,attack=.003,release=.04):
    n=min(len(x),round(attack*RATE)); r=min(len(x),round(release*RATE))
    y=x.copy(); y[:n]*=np.linspace(0,1,n); y[-r:]*=np.linspace(1,0,r)
    return y
def band(x,low=0,high=20000):
    f=np.fft.rfftfreq(len(x),1/RATE)
    shape=1/(1+(f/high)**8)
    if low: shape*=1/(1+(low/np.maximum(1,f))**8)
    return np.fft.irfft(np.fft.rfft(x)*shape,n=len(x))
def noise(t,low,high):
    x=band(RNG.normal(0,1,len(t)),low,high)
    return x/max(.1,np.std(x))
def kick(kind):
    t=time(.46); f0=48 if kind!=3 else 51
    phase=2*np.pi*(f0*t+125/55*(1-np.exp(-55*t)))
    body=np.sin(phase)*np.exp(-t*(10 if kind!=1 else 8.5))
    tick=noise(t,2500,9000)*np.exp(-t*420)*.075
    return fade(np.tanh((body+tick)*1.4)/1.4,.001,.025)
def clap():
    t=time(.25); n=noise(t,800,10000); env=np.zeros(len(t))
    for at,g in [(0,.65),(.011,.7),(.025,1)]:
        d=np.maximum(0,t-at);env+=g*np.exp(-d*100)*(t>=at)
    env+=.27*np.exp(-np.maximum(0,t-.025)*20)*(t>=.025)
    return fade(n*env*.36,.001,.04)
def snare():
    t=time(.25)
    return fade(.5*noise(t,1200,11000)*np.exp(-t*25)+.35*np.sin(2*np.pi*184*t)*np.exp(-t*30),.001,.03)
def hat(opened=False):
    t=time(.29 if opened else .09)
    metal=sum(np.sign(np.sin(2*np.pi*f*t)) for f in [3489,4313,5237,6473,7949,10103])/6
    s=band(metal,6000,15000)*.7+noise(t,6000,18000)*.28
    env=np.exp(-t*(15 if opened else 80))
    return fade(s*env,.0007,.03 if opened else .01)
def tamb():
    t=time(.22); s=sum(np.sin(2*np.pi*f*t+f%3) for f in [3273,3981,4529,6043,7841,9869])/6
    return fade((s*.6+noise(t,6500,15000)*.16)*np.exp(-t*25),.001,.03)
def cowbell():
    t=time(.18); s=.7*np.sin(2*np.pi*540*t)+.4*np.sin(2*np.pi*811*t)+.12*np.sin(2*np.pi*1622*t)
    return fade(s*np.exp(-t*25),.001,.04)
def tom(note):
    t=time(.27); f=hz(note);phase=2*np.pi*(f*t+f*.35/20*(1-np.exp(-20*t)))
    return fade((np.sin(phase)+.06*noise(t,800,5000))*np.exp(-t*15),.001,.04)
def cymbal():
    t=time(1.9);return fade(noise(t,3000,16000)*np.exp(-t*3.2)*.20,.002,.15)

def bass(note,length,style):
    t=time(length+.07); f=hz(note)
    s=np.sin(2*np.pi*f*t)
    for h in range(2,11):
        env=np.exp(-t*(5+h*(1.4 if style in [0,2] else .6)))
        s+=(.55 if style==1 else .35)/h*np.sin(2*np.pi*f*h*t+.06*h)*env
    s*=np.exp(-t*(2.8 if style!=3 else 2))
    return fade(np.tanh(s*1.7)*.72,.003,.075)
def pluck(note,length,kind):
    t=time(length+.1); f=hz(note);s=np.zeros(len(t))
    for h in range(1,13):
        a=(1 if h%2 else .45)/h**1.1
        detune=1.0002*h
        s+=a*np.cos(2*np.pi*f*h*detune*t)*np.exp(-t*(8+h*(1.3 if kind=='guitar' else .65)))
    s+=.02*noise(t,1500,9000)*np.exp(-t*180)
    return fade(np.tanh(s*1.2)*.6,.0015,.07)
def keys(note,length):
    t=time(length+.25); f=hz(note)
    s=np.sin(2*np.pi*f*t+1.8*np.exp(-t*6)*np.sin(2*np.pi*f*2*t))
    s+=.2*np.sin(2*np.pi*f*3*t)*np.exp(-t*10)
    return fade(s*np.exp(-t*3.2)*.6,.003,.14)
def synth(note,length,kind):
    t=time(length+.2); f=hz(note);s=np.zeros(len(t))
    for cents in [-6,6]:
        for h in range(1,9):
            s+=np.sin(2*np.pi*f*2**(cents/1200)*h*t+.04*h)/(h**(1.2 if kind=='brass' else 1.7)*2)
    if kind=='brass':env=(1-np.exp(-t*90))*np.exp(-t*6)
    elif kind=='pad':env=(1-np.exp(-t*16))*np.exp(-t*.8)
    else:env=(1-np.exp(-t*180))*np.exp(-t*9)
    return fade(s*env,.006,.16)

class Mix:
    def __init__(self):self.parts={k:np.zeros((N,2),dtype=np.float64) for k in ['drums','bass','chords','lead','fx']};self.events=[]
    def add(self,bus,sample,at,gain=1,pan=0):
        start=round(at*RATE); trim=max(0,-start);start=max(0,start); end=min(N,start+len(sample)-trim)
        if end<=start:return
        a=(pan+1)*np.pi/4
        stereo=sample[trim:trim+end-start,None]*np.array([np.cos(a),np.sin(a)])[None,:]*gain
        self.parts[bus][start:end]+=stereo
    def chord(self,notes,at,length,gain,kind='guitar',pan=0):
        for i,n in enumerate(notes):
            sample=pluck(n,length,kind) if kind in ['guitar','clav'] else keys(n,length) if kind=='keys' else synth(n,length,kind)
            self.add('chords',sample,at+i*.0015,gain/len(notes)**.65,pan)

VARIANTS=[
    ('mirrorball','Mirrorball','Warm octave bass, crisp handclaps, offbeat guitar, and bright disco strings.'),
    ('boogie','Neon Boogie','A punchier electronic groove with elastic bass, syncopated synth chords, and a bright arpeggio.'),
    ('pocket','Pocket Funk','A playful, lightly swung groove with clipped clavinet, cowbell, and a busier bass line.'),
    ('space','Space Disco','Airy electric keys, shimmering synths, a steady dance pulse, and a wide celebratory lift.'),
]
CHORDS=[[57,60,64,67],[53,57,60,64],[55,59,62,66],[52,56,59,62]] # Am7 Fmaj7 Gmaj7 E7
ROOTS=[33,29,31,28]

for style,(key,title,description) in enumerate(VARIANTS):
    RNG=np.random.default_rng(20092026+style)
    mix=Mix(); kd=kick(style);cp=clap();sn=snare();ch=hat();oh=hat(True);tb=tamb();cb=cowbell()
    transpose=[0,2,3,7][style]
    # Nine bars at 120 BPM: six bars spin, three bars celebrate, landing on beat 25.
    for beat in range(36):
        at=beat*BEAT
        if beat not in ([22,23] if style==3 else [23]):mix.add('drums',kd,at,.82 if style!=1 else .9)
        if beat%2==1 and beat!=23:mix.add('drums',cp,at+.009,.45,0);mix.add('drums',sn,at+.004,.15)
        if beat<35:
            mix.add('drums',oh,at+.25,.23 if style!=2 else .17,.25)
            mix.add('drums',ch,at+.005,.10,-.2)
        if beat>=24 or style==0:mix.add('drums',tb,at+.25,.09,.55)
        if style==2 and beat%4 in [1,2]:mix.add('drums',cb,at+.25,.16,-.35)
        # Quiet sixteenth-note shaker movement, with a small swing in Pocket Funk.
        if style in [0,2,3] and beat<35:
            for sub in [.125,.375]:mix.add('drums',ch,at+sub+(0.016 if style==2 else .004),.045+RNG.random()*.025,-.4 if sub<.2 else .4)
    # A short instrumental fill into the exact landing; never a casino sound effect.
    for i,at in enumerate([11,11.25,11.5,11.625,11.75,11.875]):
        mix.add('drums',sn if i<3 else tom(49-i*2),at,.18+i*.035,(-1)**i*.22)
    mix.add('drums',cymbal(),12,.85,.12)
    mix.add('drums',cymbal(),16,.35,-.2)
    for bar in range(9):
        at=bar*2
        chordidx=[0,1,2,3,0,3,0,1,0][bar]
        root=ROOTS[chordidx]+transpose
        notes=[n+transpose for n in CHORDS[chordidx]]
        if style==0:
            pattern=[(0,0,.20),(.75,12,.15),(1,0,.22),(1.5,7,.16),(2,0,.20),(2.75,12,.15),(3,7,.16),(3.5,10,.15)]
            for off in [.5,1.5,2.5,3.5]:mix.chord([n+12 for n in notes],at+off*BEAT,.12,.28,'guitar',-.38)
            for off in [0,2]:mix.chord(notes,at+off*BEAT,.75,.14,'pad',.35)
        elif style==1:
            pattern=[(0,0,.25),(.75,0,.17),(1.5,12,.18),(2,0,.2),(2.75,7,.17),(3.5,12,.2)]
            for off in [.5,1.75,2.5,3.5]:mix.chord(notes,at+off*BEAT,.22,.24,'brass',-.25)
            arp=[notes[0]+12,notes[2]+12,notes[3]+12,notes[1]+24]
            if bar>0:
                for q in range(8):mix.add('lead',synth(arp[q%4],.11,'arp'),at+q*.25,.075+(.035 if bar>=6 else 0),.4*(-1)**q)
        elif style==2:
            pattern=[(0,0,.18),(.5,12,.11),(1.25,7,.15),(1.75,10,.11),(2.5,12,.13),(3,0,.18),(3.5,7,.11),(3.75,10,.10)]
            for off in [.25,.75,1.5,2.25,2.75,3.5]:mix.chord(notes,at+off*BEAT+.008,.13,.24,'clav',-.28)
            for off in [.5,2.5]:mix.chord([n+12 for n in notes],at+off*BEAT,.10,.17,'guitar',.44)
        else:
            pattern=[(0,0,.30),(1.5,12,.20),(2,0,.27),(3,7,.18),(3.5,12,.18)]
            for off in [0,1.5,2.5]:mix.chord(notes,at+off*BEAT,.6,.26,'keys',-.2)
            mix.chord([n+12 for n in notes],at,1.8,.13,'pad',.4)
            if bar>=2:
                arp=[notes[2]+12,notes[3]+12,notes[1]+24,notes[0]+24]
                for q in range(8):mix.add('lead',keys(arp[q%4],.12),at+q*.25,.075,.4*(-1)**q)
        for off,interval,length in pattern:
            when=at+off*BEAT
            if when>=17.5 or 11.5<=when<12:continue
            mix.add('bass',bass(root+interval,length,style),when,.54 if style in [0,2] else .60)
        if bar>=6:
            mix.chord([n+12 for n in notes],at,.72,.31,'brass' if style!=3 else 'pad',0)
    # Original short winning motif; the first note and full chord strike exactly at 12s.
    motifs=[[(0,81,.28),(.75,79,.17),(1,76,.20),(1.5,79,.16),(2,81,.38),(3,84,.22),(3.5,83,.17),(4,81,.55)],
            [(0,81,.22),(.5,84,.16),(1,88,.20),(2,86,.22),(2.75,84,.16),(3.5,81,.20),(4,88,.50)],
            [(0,76,.16),(.75,79,.14),(1.5,81,.22),(2.5,84,.14),(3,81,.24),(4,79,.20),(4.75,76,.16)],
            [(0,88,.55),(1.5,86,.28),(2,84,.50),(3.5,83,.27),(4,81,.75)]]
    for off,n,length in motifs[style]:
        instrument=keys(n+transpose,length) if style==3 else synth(n+transpose,length,'brass') if style==0 else pluck(n+transpose,length,'clav') if style==2 else synth(n+transpose,length,'arp')
        mix.add('lead',instrument,12+off*BEAT,.18 if style!=0 else .23,.07)
    mix.chord([57+transpose,64+transpose,67+transpose,72+transpose],17,.58,.28,'keys' if style==3 else 'brass')
    # Soft rising filtered noise opens into the winner; no full-volume white-noise blast.
    t=time(1.7);riser=fade(noise(t,3500,10500)*(t/1.7)**2*.045,.1,.02)
    mix.add('fx',riser,10.3,1,0)
    # Short stereo echoes and a small diffuse room glue the dry synthesis together.
    melodic=mix.parts['chords']+mix.parts['lead']
    wet=np.zeros((N,2))
    for delay,gain in [(.061,.09),(.113,.07),(.187,.06),(.251,.05),(.379,.035)]:
        s=round(delay*RATE);wet[s:]+=melodic[:-s,::-1]*gain
    if style in [1,3]:
        for d,g in [(.375,.14),(.75,.065)]:
            s=round(d*RATE);wet[s:]+=mix.parts['lead'][:-s,::-1]*g
    # Modest beat-driven ducking gives a recognizable dance groove without heavy pumping.
    t=np.arange(N)/RATE
    phase=np.mod(t,BEAT)
    duck=1-(.10 if style!=1 else .18)*np.exp(-phase/0.075)
    audio=mix.parts['drums']+mix.parts['bass']+(melodic+wet)*duck[:,None]+mix.parts['fx']
    audio-=audio.mean(axis=0)
    audio=np.tanh(audio*1.05)/1.05
    end=round(.12*RATE);audio[-end:]*=np.linspace(1,0,end)[:,None]
    peak=float(np.max(np.abs(audio)));audio*=.87/max(peak,.001)
    raw=OUT/(key+'-mix.wav')
    with wave.open(str(raw),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(np.rint(audio*32767).astype('<i2').tobytes())
    name=f'MIT-2.009-Disco-{title.replace(" ","-")}-120BPM-18s'
    wav=OUT/(name+'.wav'); mp3=OUT/(name+'.mp3')
    # EBU measurement-based normalization is completed in a separate verification step.
    subprocess.run(['/opt/homebrew/bin/ffmpeg','-hide_banner','-v','error','-y','-i',str(raw),'-c:a','pcm_s24le',str(wav)],check=True)
    details={'title':title,'key':key,'description':description,'bpm':120,'seconds':18,'sample_rate':RATE,'channels':2,'landing_seconds':12,'composition':'Original programmed and synthesized instrumental, no borrowed recordings or samples','wav':wav.name,'mp3':mp3.name,'preview_video':'Neon Circuit (30), original video stream unchanged','structure':'0–10s groove; 10–12s short build and fill; 12s landing accent; 12–18s winning section'}
    (OUT/(key+'-details.json')).write_text(json.dumps(details,indent=2)+'\n')
    print(title, 'composed', flush=True)
