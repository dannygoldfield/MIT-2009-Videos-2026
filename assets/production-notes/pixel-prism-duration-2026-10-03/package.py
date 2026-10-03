"""Verify all three requested duration tests before adding them to All Tests."""
from pathlib import Path
import hashlib, json, shutil, struct, subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'outputs/MIT-2.009-Pixel-Prism-Duration-Tests-2026-10-03'
REPO = HERE.parent / 'mit2009-video-catalog'
NOTES = REPO / 'assets/production-notes/pixel-prism-duration-2026-10-03'

def run(args):
    return subprocess.run(args, capture_output=True, check=True)

def audio_hash(path):
    return run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).stdout.decode().strip().split('=')[1]

def pcm(path):
    return run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-f','s24le','-acodec','pcm_s24le','-']).stdout

catalog = json.loads((REPO / 'assets/CATALOG.json').read_text())
assert len(catalog) == 40 and catalog[-1]['number'] == 53
selects_before = (REPO / 'assets/SELECTS.json').read_bytes()
original = json.loads((REPO / 'assets/production-notes/blue-disco-d-2026-09-26/pixel-details.json').read_text())
source = ROOT / 'outputs/MIT-2.009-Disco-Beat-Tests-2026-09-26/MIT-2.009-Disco-Space-Disco-120BPM-18s.wav'
source_pcm = pcm(source)
bps = 48000 * 2 * 3
tail = None
records, verification = [], []
for number, duration in [(54,15),(55,13),(56,11)]:
    landing = duration - 3
    d = json.loads((OUT / f'{duration}s-details.json').read_text())
    video, audio = OUT / d['file'], OUT / f'Disco-D-{duration}s.m4a'
    ah = audio_hash(audio)
    if audio_hash(video) != ah:
        fixed = video.with_name(video.stem + '-remux.mp4')
        run(['ffmpeg','-v','error','-y','-i',str(video),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c','copy','-t',str(duration),'-movflags','+faststart',str(fixed)])
        assert audio_hash(fixed) == ah
        fixed.replace(video)
    probe = json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
    v, a = probe['streams']
    assert (v['codec_name'],v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'],int(v['nb_frames'])) == ('h264',1080,1920,'60/1','yuv420p',duration*60)
    assert (a['codec_name'],int(a['sample_rate']),a['channels'],float(a['start_time'])) == ('aac',48000,2,0)
    assert float(probe['format']['duration']) == duration
    assert d['target'] == 88 and d['settledTime'] == landing and d['celebrationAt'] == landing
    assert d['photos'] == original['photos'] and d['celebrationSeconds'] == 3
    assert d['retainNeighbors'] and d['audioTempoBPM'] == 120
    run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'])
    boxes = []
    with video.open('rb') as f:
        while header := f.read(8):
            size, kind = struct.unpack('>I4s', header)
            header_size = 8
            if size == 1:
                size = struct.unpack('>Q', f.read(8))[0]
                header_size = 16
            assert size >= header_size
            boxes.append(kind.decode())
            f.seek(size-header_size, 1)
    assert boxes.index('moov') < boxes.index('mdat')
    data = pcm(OUT / f'Disco-D-{duration}s.wav')
    assert len(data) == duration*bps
    start = (15-duration)*bps
    # The source samples outside the opening/closing fades remain unchanged.
    assert data[bps:-bps] == source_pcm[start+bps:15*bps-bps]
    this_tail = data[-3*bps:]
    if tail is None:
        tail = this_tail
    else:
        assert tail == this_tail, 'The three winning phrases must be identical'
    digest = hashlib.sha256(video.read_bytes()).hexdigest()
    records.append(dict(number=number,title=f'Pixel + Prism — {duration}-second test',
        description=f'Pixel Party’s colored perimeter squares with Prism Jackpot’s burst of lines. The same Blue Team portrait lands at {landing} seconds, followed by a three-second celebration. Same 54-photo sequence and Disco D at its original tempo, with the musical accent aligned to the landing.',
        file='videos/'+video.name,seconds=duration,dimensions='1080 × 1920',format='Portrait 9:16',photo_count=54,
        size_mb=round(video.stat().st_size/1e6,1),online_url='',thumbnail=f'previews/{number}.jpg',sha256=digest,
        fps=60,codec='H.264',audio=f'Disco D — Space Disco, 120 BPM · {duration}-second edit',audio_sha256=ah,
        fast_start=True,loop=False,landing_seconds=landing,celebration_seconds=3))
    verification.append(dict(number=number,seconds=duration,frames=duration*60,landing_seconds=landing,celebration_seconds=3,
        same_54_original_photos=True,full_decode_pass=True,fast_start=True,audio_sha256=ah,video_sha256=digest,
        audio_source_start=15-duration,audio_source_end=15,original_tempo_and_gain=True,identical_three_second_music_finish=True))
    print(f'Verified {number}: {duration}s, landing {landing}s, {video.stat().st_size/1e6:.1f} MB', flush=True)

NOTES.mkdir(parents=True, exist_ok=True)
for record, duration in zip(records,[15,13,11]):
    shutil.copy2(OUT / Path(record['file']).name, REPO / 'assets' / record['file'])
    shutil.copy2(OUT / f'{duration}s-poster.jpg', REPO / 'assets' / record['thumbnail'])
    shutil.copy2(OUT / f'{duration}s-details.json', NOTES / f'{duration}s-details.json')
for name in ['render.cjs','lights.cjs','prepare.py','package.py']:
    shutil.copy2(HERE / name, NOTES / name)
(OUT / 'VERIFICATION.json').write_text(json.dumps(verification, indent=2)+'\n')
shutil.copy2(OUT / 'VERIFICATION.json', NOTES / 'VERIFICATION.json')
(REPO / 'assets/CATALOG.json').write_text(json.dumps(catalog+records, ensure_ascii=False, indent=2)+'\n')
assert (REPO / 'assets/SELECTS.json').read_bytes() == selects_before
print('Three requested experiments added to All Tests; Selects preserved.')
