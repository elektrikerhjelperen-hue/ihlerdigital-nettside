#!/usr/bin/env python3
# Lager AVIF/WebP av ekte skjermbilder og ikoner. Kjør fra repo-rota. Trenger Pillow >= 11.3.
import json, os, sys, urllib.request
from PIL import Image
H = os.path.expanduser('~/Apper-filer/')
A = os.path.expanduser('~/Apper/')
EL = H+'Elektrikerhjelpen/natt/klar-for-appstore/skjermbilder/iphone/pm-lys-%s.png'
TR = H+'TrollMineTycoon/klar-for-appstore/appstore-skjermbilder/%s.png'
BK = H+'BlockKingdom/natt/ide-runde/105-blockkingdom-forbedringer/skjermbilder/etter/%s.png'
HL = H+'Handlelista/trinn4/%s.png'
PM = H+'Prosjektmappa/skjermbilder/%s.png'
TL = H+'TotallyLegit/natt/ide-runde/100-totallylegit-kvalitetsrunde/skjermbilder/%s.png'
ID = {'ga':'6827586327','tl':'6820141470','el':'6795866616','tr':'6827335548'}
tmp='/tmp/id-store'; os.makedirs(tmp,exist_ok=True)
info={}
def store(k,i):
    if k not in info:
        info[k]=json.load(urllib.request.urlopen(f'https://itunes.apple.com/lookup?id={ID[k]}&country=no'))['results'][0]
    u=info[k]['screenshotUrls'][i].rsplit('/',1)[0]+'/720x0w.jpg'
    p=f'{tmp}/{k}-{i}.jpg'
    if not os.path.exists(p): urllib.request.urlretrieve(u,p)
    return p
def icon(k):
    p=f'{tmp}/{k}-icon.jpg'
    if not os.path.exists(p): store(k,0); urllib.request.urlretrieve(info[k]['artworkUrl512'].replace('512x512bb','1024x1024bb'),p)
    return p
skudd={
 'elektrikerhjelpen':[('kabelberegning',EL%'kabelberegning'),('borevinkel',EL%'borevinkel'),('downlights',EL%'nedlysplassering'),('kursfortegnelse',EL%'kursfortegnelse'),('romkart',EL%'romkart')],
 'garasjen':[('forside',lambda:store('ga',0)),('jukselapp',lambda:store('ga',1)),('paminnelser',lambda:store('ga',2)),('logg',lambda:store('ga',4)),('tema',lambda:store('ga',6))],
 'totallylegit':[('kontor',lambda:store('tl',0)),('hovedkvarter',lambda:store('tl',1)),('samtale',TL%'etter-samtale'),('reisen',lambda:store('tl',3))],
 'trollminetycoon':[('hula',TR%'01-trollhula-mannskap'),('jernfjellet',TR%'02-jernfjellet'),('dampdalen',TR%'03-dampdalen'),('trollfest',TR%'04-gylne-troll-trollfest')],
 'block-kingdom':[('kart',BK%'c2-kart'),('brett',BK%'c1-daily-spill'),('hvelv',BK%'c5-heist'),('slott',BK%'c3-slott')],
 'prosjektmappa':[('etasjekart',PM%'trinn7/1-etasjekart'),('lag',PM%'trinn-4/1-el-rom-med-lag'),('lukking',PM%'trinn-5/4-vegg-klar'),('kunde',PM%'trinn11/1-gi-til-kunde'),('pdf',PM%'trinn7/3-forhandsvisning')],
 'handlelista':[('liste',HL%'1-gruppert-lys'),('mork',HL%'1-gruppert-mork'),('meny',HL%'3-meny-lys'),('butikk',HL%'4-butikkrekkefolge-lys')],
}
ikoner={'elektrikerhjelpen':lambda:icon('el'),'garasjen':lambda:icon('ga'),'totallylegit':lambda:icon('tl'),'trollminetycoon':lambda:icon('tr'),
 'block-kingdom':A+'BlockKingdom/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png','handlelista':A+'Handlelista/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png',
 'prosjektmappa':A+'Prosjektmappa/App/Assets.xcassets/AppIcon.appiconset/ikon-1024.png'}
def lagre(im,base):
    im.save(base+'.avif',quality=55,speed=4)
    im.save(base+'.webp',quality=78,method=6)
mal={}
for app,lst in skudd.items():
    os.makedirs(f'bilder/{app}',exist_ok=True)
    mal[app]={}
    for n,src in lst:
        src=src() if callable(src) else src
        im=Image.open(src).convert('RGB')
        for w in (360,720):
            h=round(im.height*w/im.width)
            lagre(im.resize((w,h),Image.LANCZOS),f'bilder/{app}/{n}-{w}')
        mal[app][n]=round(im.height/im.width,4)
os.makedirs('ikoner',exist_ok=True)
for app,src in ikoner.items():
    src=src() if callable(src) else src
    im=Image.open(src).convert('RGB')
    for s in (128,320):
        lagre(im.resize((s,s),Image.LANCZOS),f'ikoner/{app}-{s}')
json.dump(mal,open('_bygg/bildemal.json','w'),indent=0)
