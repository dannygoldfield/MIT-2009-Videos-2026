from pathlib import Path
import json, subprocess, hashlib, wave, shutil
import numpy as np

WORK=Path(__file__).resolve().parent
OUT=WORK.parents[1]/'outputs/MIT-2.009-Disco-Beat-Tests-2026-09-26'
REPO=Path('/Users/dannygoldfield/Projects/MIT-2009-Videos-2026')
FF='/opt/homebrew/bin/ffmpeg'
SOURCE=REPO/'assets/videos/MIT-2.009-Digital-Slot-Neon-Circuit-18s-Silent.mp4'

def run(args):
    p=subprocess.run(args,capture_output=True,text=True,check=True)
    return p
def measurement(file):
    p=run([FF,'-hide_banner','-i',str(file),'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'])
    return json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):])[0]
def videohash(file):
    return run([FF,'-v','error','-i',str(file),'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).stdout.strip()

source_hash=videohash(SOURCE)
for key in ['mirrorball','boogie','pocket','space']:
    d=json.loads((OUT/(key+'-details.json')).read_text())
    raw=OUT/(key+'-mix.wav');wav=OUT/d['wav'];mp3=OUT/d['mp3']
    m=measurement(raw)
    filt='loudnorm=I=-16:TP=-1.5:LRA=9:linear=true:'+':'.join(f'{k}={m[v]}' for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])
    run([FF,'-v','error','-y','-i',str(raw),'-af',filt,'-ar','48000','-ac','2','-c:a','pcm_s24le',str(wav)])
    run([FF,'-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','256k','-metadata','title=2.009 — '+d['title'],'-metadata','artist=MIT 2.009 Test Studio',str(mp3)])
    video=OUT/('MIT-2.009-Neon-Circuit-Disco-'+d['title'].replace(' ','-')+'-18s.mp4')
    run([FF,'-v','error','-y','-i',str(SOURCE),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-t','18','-movflags','+faststart',str(video)])
    probe=json.loads(run(['/opt/homebrew/bin/ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
    assert len(probe['streams'])==2
    v,a=probe['streams']
    assert (v['codec_name'],v['width'],v['height'],v['r_frame_rate'])==('h264',1080,1920,'60/1')
    assert (a['codec_name'],int(a['sample_rate']),a['channels'])==('aac',48000,2)
    assert float(probe['format']['duration'])==18
    assert videohash(video)==source_hash
    run([FF,'-v','error','-i',str(video),'-f','null','-'])
    measured=measurement(wav)
    assert -17<float(measured['input_i'])<-15
    assert float(measured['input_tp'])<=-1.0
    # Verify there is signal throughout the arrangement and a clean, quiet ending.
    pcm=subprocess.run([FF,'-v','error','-i',str(wav),'-f','f32le','-acodec','pcm_f32le','-'],capture_output=True,check=True).stdout
    audio=np.frombuffer(pcm,dtype='<f4').reshape(-1,2)
    assert len(audio)==18*48000 and np.isfinite(audio).all()
    rms=[float(np.sqrt(np.mean(audio[i*24000:(i+1)*24000]**2))) for i in range(36)]
    assert min(rms)>.005 and np.max(np.abs(audio[-48:]))<.015
    d.update(video=video.name,integrated_lufs=float(measured['input_i']),true_peak_dbtp=float(measured['input_tp']),video_stream_unchanged=True,video_sha256=hashlib.sha256(video.read_bytes()).hexdigest(),half_second_rms=rms)
    (OUT/(key+'-details.json')).write_text(json.dumps(d,indent=2)+'\n')
    shutil.move(str(raw),str(WORK/raw.name))
    print(json.dumps({k:d[k] for k in ['title','video','integrated_lufs','true_peak_dbtp','video_stream_unchanged']}),flush=True)
