"""Four deterministic original disco sketches. No external audio samples."""
from pathlib import Path
import json, math, wave, subprocess
import numpy as np

RATE=48000
DURATION=15
N=RATE*DURATION
BEAT=.5
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/MIT-2.009-Unified-Slot-Disco-D-2026-09-28'
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

