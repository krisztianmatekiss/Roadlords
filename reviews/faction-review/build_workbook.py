from pathlib import Path
from collections import Counter
import json, re, math, html, runpy, textwrap
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'runtime.json').read_text())
M=runpy.run_path(str(ROOT/'design_notes.py')); NOTES=M['NOTES']; IDEAS=M['IDEAS']; INTRO=M['INTRO']
for v in INTRO.values():v['risk']=v['risk'].removeprefix('Vizsgálandó: ')
NAMES={r:v['name'] for r,v in INTRO.items()}
LABEL={'unit':'Egység','building':'Épület','normal':'Common','legendary':'Legendás'}
COST_NAMES={'wood':'fa','stone':'kő','food':'élelem'}
HEADERS=['Csoport','Állapot','Név','Jelenlegi hatás','L4 ágak / halmozás','Méret, ár, előfeltétel','Átfedés / kapcsolódó sor','Javasolt döntés','Új vagy módosított hatás','Megjegyzés / indoklás','Prioritás','Saját döntésed','Saját megjegyzésed','Azonosító']
SOURCE_BASE='https://github.com/krisztianmatekiss/Roadlords/blob/57d5366/'

def fmt(n):
    return f'{n:.3f}'.rstrip('0').rstrip('.').replace('.',',') if isinstance(n,(int,float)) else str(n)
def price(p,r):
    if r=='undead':return fmt(p.get('wood',0))+' Lélek'
    return ', '.join(fmt(p[k])+' '+('hús' if r=='orc' and k=='food' else COST_NAMES[k]) for k in COST_NAMES if p.get(k,0)) or 'Ingyenes'
def refkey(r,k,i):return r+':'+k+':'+i

def normalized(s,context=''):
    # Convert authored world-coordinate ranges into the game's accepted metre scale.
    s=s.replace('+150 hatótáv','+15 m hatótáv').replace('Hatótáv: 82,5','Hatótáv: 8,25 m')
    s=s.replace('80 távolságon belüli','8 m távolságon belüli').replace('40 távolságon belüli','4 m távolságon belüli')
    s=s.replace('120 hatótávon belüli','12 m-es körzetben lévő').replace('30 hatótávon belüli','3 m-es körzetben lévő')
    s=s.replace('50 megtett távolságonként','5 méter megtétele után')
    if context=='orc_ram/rush':s=s.replace('20 → 60','2,5 → 7,5 m/s')
    return s

# Actual prerequisites, not desired new rules. Missing requirements are called out in notes.
H_PRE={
'production':'Nincs külön épületfeltétel.','tower_crews':'Nincs külön épületfeltétel.','gate_discipline':'Nincs külön épületfeltétel.','building_discount':'Kevesebb mint 5 korábbi felvétel.','tower_regen':'Legalább 1 Toronykezelők felvétel.',
'chain_spawn':'Legalább 2 aktív katonai termelő.','factory_network':'Legalább 2 aktív katonai termelő.',
'specialization':'Legalább 1 már felvett Common fejlesztés.','wide_choice':'Nincs külön épületfeltétel.','double_choice':'Nincs külön épületfeltétel.','overproduction':'Nincs külön épületfeltétel.',
'instant_l3':'Legalább 1 érvényes épületfejlesztési lehetőség.','arm_the_people':'Legalább 1 Favágó, Kővágó vagy Farm.',
'supply_hub':'Raktár és katonai termelő.','tower_salvo':'Legalább 1 Toronykezelők felvétel.','tower_rebuild':'Toronykezelők és legalább 2 lerombolt saját torony.',
'campaign_feast':'Kocsma és Gyülekezőtér.','tavern_chain':'Kocsma.','house_militia':'Lakóház.','armor_extended_range':'Páncélkovács.','magic_order':'Templom.',
'hospital_veterans':'Hadi kórház.','hospital_doomed':'Hadi kórház.','rally_cavalry_rush':'Gyülekezőtér és Lovagképzés.','capital_studies':'Főépület.',
'high_keep':'Főépület, még L4 alatt.','royal_district':'Főépület, még L4 alatt.','strategic_superiority':'Nincs külön épületfeltétel.'}
O_PRE={
'orc_bleed':'Harci tábor.','orc_leech':'Dühöngők tábora.','orc_double':'Goblin-tábor; 20 felvétel alatt.',
'orc_spear_crit':'Wargkarám.','orc_curse_duration':'Sámántábor.','orc_troll_regen':'Trollverem.',
'orc_cargo':'Faltörő műhely és Trójai kos legendás.','orc_cursed_damage':'Katonai termelő és Sámántábor.','orc_enemy_ancestors':'Ősök Toteme.',
'orc_food_discount':'Katonai termelő; kevesebb mint 7 felvétel.','orc_refund':'Kevesebb mint 5 felvétel.','orc_blessing':'Kevesebb mint 40 felvétel.','orc_loot':'Kevesebb mint 10 felvétel.',
'orc_ancient_deposits':'Jelenleg nincs külön Munkatábor-feltétel a definícióban.',
'orc_bers_rage':'Dühöngők tábora.','orc_gob_bow':'Goblin-tábor.','orc_bers_blood':'Dühöngők tábora.','orc_gob_blood':'Goblin-tábor.','orc_warg_instinct':'Wargkarám.',
'orc_last_blood':'Harci tábor.','orc_horde_heart':'Harci tábor.','orc_volley':'Goblin-tábor.','orc_hunt':'Wargkarám.','orc_predator':'Wargkarám.',
'orc_curse_master':'Sámántábor.','orc_curse_spread':'Sámántábor.','orc_dispel':'Sámántábor és ellenséges ideiglenes buffforrás.',
'orc_siege_shield':'Faltörő műhely.','orc_trojan':'Faltörő műhely.','orc_glutton':'Trollverem.','orc_last_rampage':'Trollverem.',
'orc_united_huts':'Kunyhó.','orc_crowded_huts':'Kunyhó.','orc_transfusion':'Legalább egy saját ork életlopásforrás.',
'orc_skip_power':'Legalább 1 katonai termelő.'}
U_FAMILY={'skeleton':'und_graveyard','zombie':'und_morgue','ghost':'und_ghost_spawner','necromancer':'und_necro_spawner','necro':'und_necro_spawner','vampire':'und_vampire_castle','lich':'und_lich_spawner'}
U_PRE={'gen_soul_abundance':'Nincs külön épületfeltétel.','gen_graveyard_capacity':'Jelenleg nincs külön álló Temető-feltétel.','garden_chance':'Holtak kertje.','gen_soul_frugal':'Nincs külön épületfeltétel.','gen_military_speed':'Jelenleg nincs külön katonai épületfeltétel.','und_soul_might':'Legalább 1 katonai termelő.'}
UNIT_PRODUCER={u['id']:(r,u['producer']) for r,d in D['factions'].items() for u in d['units']}
BUILD_NAMES={(r,b['id']):b['name'] for r,d in D['factions'].items() for b in d['buildings']}

def prereq(r,k,o):
    i=o['id']
    if r=='human':
        if i in H_PRE:return H_PRE[i]
        match=re.search(r'unitAvailable\([^,]+,[`\'"]([^`\'"]+)',o.get('eligibleSource',''))
        if match and match.group(1) in UNIT_PRODUCER:
            return BUILD_NAMES[(r,UNIT_PRODUCER[match.group(1)][1])]+'.'
        return 'Legalább 1 katonai termelő.'
    if r=='orc':
        if i in O_PRE:return O_PRE[i]
        if re.search(r'_(hp|dmg)$',i):
            unit=re.sub(r'_(hp|dmg)$','',i)
            if unit in UNIT_PRODUCER:return BUILD_NAMES[(r,UNIT_PRODUCER[unit][1])]+'.'
        if i in ['orc_wood','orc_stone','orc_food','orc_as','orc_hp','orc_crit']:
            return 'Jelenleg nincs külön termelőfeltétel a laphoz.'
        return 'Legalább 1 katonai termelő.' if i in ['orc_move','orc_siege_damage','orc_lifesteal'] else 'Ork faj; jelenleg nincs külön további épületfeltétel.'
    if i in U_PRE:return U_PRE[i]
    if i.startswith('und_'):return 'Legalább 1 katonai termelő.'
    family=i.split('_')[0]
    if family in U_FAMILY:return BUILD_NAMES[(r,U_FAMILY[family])]+'.'
    return 'Élőhalott faj.'

ABILITIES={
'swordsman':'Olcsó közelharcos az első sorba.',
'spearman':'Lovasság és nehéz egység ellen +150% sebzés. Nincs alap −50% lovasság elleni kapottsebzés-csökkentés.',
'archer':'Távolsági fizikai lövész; 3,5 m-en belül alapból csak 25% sebzés.',
'knight':'Gyors, nagyobb HP-jú páncélos lovas; a rohamhoz külön fejlesztés kell.',
'priest':'30 HP gyógyítás, 4,2 mp külön gyógyítási ciklus, 30 m gyógyítási hatótáv; mozgás/harc mellett is gyógyít.',
'catapult':'Épületek ellen 65, egységek ellen 12 alapsebzés. Fizikai távolsági ostrom, heavy címkével.',
'mage':'24 elsődleges tűzgolyó-sebzés, 45% másodlagos sebzés (10,8), alap területi hatással.',
'orc_warrior':'Nagy HP-jú közelharcos, külön alappasszív nélkül.',
'orc_berserker':'Minden 2% hiányzó HP után +1% támadási sebesség.',
'orc_goblin':'Gyors, kevés HP-jú távolsági parittyás.',
'orc_warg':'Nyitó gerely 60 sebzéssel, 23 m hatótávval; utána közelharc. Épületeknél a dobás gyengébb.',
'orc_ram':'130 épületsebzés, 8 egységsebzés; −50% kapott fizikai sebzés. Heavy ostromegység.',
'orc_troll':'110 elsődleges, 35 másodlagos csapás, 5,5 m területi sugár; 4 sereghely. Közelharci + ostrom + heavy.',
'und_skeleton':'−25% kapott távolsági fizikai fegyversebzés.',
'und_skeleton_archer':'Távolsági Csontváz; ugyanaz a 25% fegyverellenállás. Temetőből, Csontváz Íjász fejlesztéssel, nem külön spawnerből.',
'und_zombie':'Harci halálakor 4 méregpont a 3 m-es körzet ellenségeinek.',
'und_ghost':'40% kitérés a támadások és területi találatok ellen; a kivédett találat állapothatásai sem érik.',
'und_necromancer':'18,75 mp-enként 3 Csontvázat idéz 10 mp-re. Az idézettek alapból nem foglalnak sereghelyet.',
'und_vampire':'30% életlopás a tényleges HP-sebzésből.',
'und_lich':'5 mp-enként új kötelék; sugáronként 5 sebzés/mp, másodpercenként +2 felfutás, a célpont haláláig; a sugár HP-sebzéséből gyógyul.'}

ROWS={}; RECORDS={}
for r,d in D['factions'].items():
    rows=[]
    for k,data in [('unit',d['units']),('building',d['buildings']),('normal',d['normal']),('legendary',d['legendary'])]:
        for o in data:
            i=o['id']; note=NOTES[(r,k,i)]; current=''; progression=''; extra=''; detail=''
            if k=='unit':
                s=o['effectiveStats'];current=ABILITIES.get(i,o.get('description',''))
                extra=f"HP: {fmt(s['hp'])}; sebzés: {fmt(s['dmg'])}; támadásköz: {fmt(s['cooldown'])} mp.\nHatótáv: {fmt(s['range']/10)} m; mozgás: {fmt(s['speed']/10)} m/s.\nEgységár: {price(o['price'],r)}; sereghely: {fmt(o['slots'])}.\nKépzés L1/L2/L3: {' / '.join(fmt(t) for t in o['training'])} mp.\nTermelő: {BUILD_NAMES[(r,o['producer'])]}."
                if o.get('buildingDamage'):extra+=f"\nÉpületsebzés: {fmt(s['buildingDamage'])}."
                progression='Az egység alapváltozata; L4 hatásai a termelő épület sorában.\nAz elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.'
            elif k=='building':
                lv=o['levels'];current=lv[0]['description'] if lv else o['description']
                if o.get('unit'):
                    u=next(u for u in d['units'] if u['id']==o['unit'])
                    current+=f"\nL1 ciklus: {fmt(u['training'][0])} mp. Egységár: {price(u['price'],r)}."
                bs=o['branches']
                if bs:progression='\n\n'.join('L4 '+chr(65+j)+' – '+b['name']+':\n'+normalized(b['description'],i+'/'+b['id']) for j,b in enumerate(bs))
                elif lv and lv[-1]['level']==4:progression='Egyenes L4, nincs két választható ág:\n'+lv[-1]['description']
                else:progression='Nincs L4 specializáció.\n'+('Az épület jelenleg nem fejleszthető.' if i in ['alchemist','towercommand'] else 'Legmagasabb szint a jelenlegi definíció szerint: '+str(lv[-1]['level']) if lv else '')
                
                if i=='keep':
                    base4='160 000 HP; +8 fa, kő és élelem/mp; 800 tároló/nyersanyag; 400 sereghely; kapu 40 egység/mp.' if r!='undead' else '16 000 HP; +24 Lélek/mp; 400 sereghely; kapu 40 egység/mp.'
                    progression='L4 alap, az ág saját eltérései előtt:\n'+base4+'\n\n'+progression
                if i=='orc_tunnel':progression=progression.replace('Minden tábor mezőn belül a táborok','Az összes saját katonai tábor')
                cells=len(o['shape']);w=max(p[1] for p in o['shape'])+1;h=max(p[0] for p in o['shape'])+1
                extra=f"Terület: {w}×{h}, {cells} mező"+(' (nem teljes téglalap)' if cells!=w*h else '')+'.\n'
                extra+='Építés: '+price(lv[0]['cost'],r)+'.\n'+('Egyedi épület.' if o.get('unique') else 'Több példány építhető az alapdefiníció szerint.')
                if r=='undead':extra+='\nAlapfenntartás: '+fmt(o.get('upkeep',0))+' Lélek/mp.'
                if o.get('unit'):
                    u=next(u for u in d['units'] if u['id']==o['unit']);extra+='\nL1 kibocsátás/mező: '+fmt(60/u['training'][0]/cells)+' egység/perc, 1-es alapbatch-csel.'
                detail='\n'.join('L'+str(m['level'])+': '+m['description']+'\n'+'; '.join(a+': '+b for a,b in m['rows']) for m in lv)
            else:
                current=normalized(o['description'],i)
                preview=o.get('preview') or {};progression=preview.get('stacking','Egyszer választható.' if k=='legendary' else 'Halmozható a jelenlegi szabályok szerint.')
                progression=re.sub(r'Felvéve:.*','',progression,flags=re.I).replace('· felvéve: 0 → 1.','').strip()
                if preview.get('rows'):progression+='\nElső felvétel: '+'; '.join(a['label']+': '+a['before']+' → '+a['after'] for a in preview['rows'])
                extra='Előfeltétel: '+prereq(r,k,o)+'\nÁr: egy megfelelő választás, nincs külön nyersanyagár.'
                detail='Forrás: a futó 4.56.0-s katalógus, fajspecifikus szűréssel.\nTényleges előfeltétel: '+prereq(r,k,o)
            row={'race':r,'kind':k,'status':'Meglévő','id':i,'name':('Ork főépület' if r=='orc' and i=='keep' else o['name']), 'current':current,'progression':progression,'extra':extra,'detail':detail,**note}
            rows.append(row);RECORDS[refkey(r,k,i)]=row
        for p in [p for p in IDEAS if p['race']==r and p['kind']==k]:
            row={'race':r,'kind':k,'status':'Új ötlet','id':p['id'],'name':p['name'],'current':'Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.',
              'progression':p.get('l4') or p['limits'],'extra':'Előfeltétel / terv:\n'+p['prereq'], 'detail':p['limits'],
              'decision':p.get('decision','Új ötlet'),'why':p['why'],'proposal':p['effect']+'\n\nKorlát / értelmezés: '+p['limits'],'refs':p['refs'],'priority':p['priority']}
            rows.append(row);RECORDS[refkey(r,k,p['id'])]=row
    ROWS[r]=rows
# Contextual fixes: keep literal current bad copy visible, with its proven implementation alongside it.
RECORDS['orc:legendary:orc_hunt']['current']+='\n\nKÓDBAN TÉNYLEGES HATÁS: Warglovas ölés után ingyen lándzsadobás. A fenti élelemtermelés hibás jelenlegi kártyaszöveg.'
# Include rulebook clarifications without bloating the main displayed effect.
RULES=json.loads((ROOT.parent.parent/'src/data/card-rules.json').read_text())
for row in RECORDS.values():
    if row['status']=='Meglévő' and row['id'] in RULES:row['detail']+='\n\nLexikon részletek: '+RULES[row['id']]

# Validate coverage before generating any deliverable.
assert sum(len(x) for x in ROWS.values())==len(NOTES)+len(IDEAS)
for key,row in RECORDS.items():
    assert row['why'] and row['decision'],key
    row['refs']=[ref for ref in row['refs'] if ref!=key]
    assert all(ref in RECORDS for ref in row['refs']),(key,row['refs'])

wb=Workbook();wb.remove(wb.active);wb.properties.title='Roadlords – három faj részletes tervezési áttekintése';wb.properties.subject='Jelenlegi tartalom, faji egyediség, átfedések és új ötletek';wb.properties.creator='Roadlords';wb.properties.description='4.56.0; 3 faj; minden döntés javaslat, nincs beépítve.'
wb.calculation.fullCalcOnLoad=True
ROWMAP={refkey(r,row['kind'],row['id']):(INTRO[r]['name'],j+16) for r,rows in ROWS.items()for j,row in enumerate(rows)}
FILL={'Megtartás':'E1F1E5','Szerep megtartása':'E1F1E5','Törlésjelölt':'FBE3E0','Átdolgozás':'FFF0CD','Összevonás':'FFF0CD','Szövegjavítás':'FAD7C9','Új ötlet':'E8E0F4','Elvetendő ötlet':'E8E8E8','Próba szükséges':'E4EDF5'}
WIDTHS=[14,12,29,56,65,47,42,25,74,74,12,18,36,30]

for r,rows in ROWS.items():
    inf=INTRO[r];ws=wb.create_sheet(inf['name']);ws.sheet_properties.tabColor=inf['color'];ws.sheet_view.showGridLines=False;ws.sheet_view.zoomScale=85
    for j,w in enumerate(WIDTHS,1):ws.column_dimensions[get_column_letter(j)].width=w
    ws.column_dimensions['N'].hidden=True
    def band(rng,value,fill,fontcolor='FFFFFF',size=11,bold=False):
        ws.merge_cells(rng);c=ws[rng.split(':')[0]];c.value=value;c.fill=PatternFill('solid',fgColor=fill);c.font=Font(name='Aptos',size=size,bold=bold,color=fontcolor);c.alignment=Alignment(vertical='center',wrap_text=True)
    band('A1:N1',inf['name'].upper()+'  |  ROADLORDS – FAJI EGYEDISÉG',inf['color'],size=21,bold=True);ws.row_dimensions[1].height=38
    band('A2:N2','4.56.0 · 2026. október 28. · Elemzés és döntés-előkészítés; a javaslatok NINCSENEK beépítve.', '172A28',size=11,bold=True);ws.row_dimensions[2].height=25
    d=D['factions'][r];cnt=Counter(p['kind']for p in IDEAS if p['race']==r)
    band('A3:N3',f"JELENLEGI KATALÓGUS: {len(d['buildings'])} épület · {len(d['units'])} egység · {len(d['normal'])} Common · {len(d['legendary'])} legendás.  ÖTLETJELÖLTEK: {cnt['building']} épület · {cnt['normal']} Common · {cnt['legendary']} legendás (átvételek/alternatívák/elvetendő irány külön jelölve).",'E5EBEF','20323D',11,True);ws.row_dimensions[3].height=30
    band('A4:F6','JELENLEGI FAJ\n'+inf['now'],'F0F4F6','20323D',11)
    band('G4:N6','JAVASOLT SAJÁT IRÁNY\n'+inf['target'],'EDF2E9','263A2C',11)
    for ri in range(4,7):ws.row_dimensions[ri].height=28
    band('A7:N8','KIEMELT VIZSGÁLAT\n'+inf['risk'],'FFF1D7','61451A',11)
    ws.row_dimensions[7].height=25;ws.row_dimensions[8].height=25
    band('A9:N10','OLVASÁSI SZABÁLY: D–F a mostani játék adatai; H–J a javaslat. A színek döntési jelölések, nem jóváhagyások. A meglévő alapértékek bónuszok és terep nélküliek; a különböző fajú nyersanyagárak nem közvetlenül egyenértékűek. A kibocsátás/mező nem erősségi rangsor. Az új ötletek számai próbaértékek; győzelmiarány-mérés nem készült.','F5F5F1','404D4A',10)
    ws.row_dimensions[9].height=21;ws.row_dimensions[10].height=21
    for rng,txt,col in [('A11:C11','ZÖLD · megtartás','E1F1E5'),('D11:F11','PIROS · törlés / javítandó hiba','FBE3E0'),('G11:J11','SÁRGA · átdolgozás / összevonás','FFF0CD'),('K11:N11','LILA · új ötlet / átvétel','E8E0F4')]:band(rng,txt,col,'20323D',10,True)
    band('A12:N12','HASZNÁLAT: a táblázat szűrőivel választhatsz csoportot, meglévő/új tartalmat és döntési javaslatot. L–M-be írhatsz saját döntést és megjegyzést. A G oszlop első hivatkozása kattintható; az összes kapcsolódás a cellamegjegyzésben is szerepel. N-ben rejtve marad a technikai azonosító.','F0F4F6','20323D',10);ws.row_dimensions[12].height=32
    for rng,k in [('A13:C13','unit'),('D13:F13','building'),('G13:J13','normal'),('K13:N13','legendary')]:
        band(rng,'UGRÁS: '+LABEL[k],inf['color'],size=11,bold=True)
        dest=next(j+16 for j,x in enumerate(rows)if x['kind']==k);c=ws[rng.split(':')[0]];c.hyperlink=f"#'{inf['name']}'!A{dest}";c.font=Font(name='Aptos',size=11,bold=True,color='FFFFFF',underline='single')
    ws.row_dimensions[13].height=24;ws.row_dimensions[14].height=8
    for j,h in enumerate(HEADERS,1):
        c=ws.cell(15,j,h);c.fill=PatternFill('solid',fgColor=inf['color']);c.font=Font(name='Aptos',size=11,bold=True,color='FFFFFF');c.alignment=Alignment(wrap_text=True,vertical='center')
    ws.row_dimensions[15].height=35
    for rr,row in enumerate(rows,16):
        refs='\n'.join(NAMES[RECORDS[x]['race']]+' / '+LABEL[RECORDS[x]['kind']]+' / '+RECORDS[x]['name'] for x in row['refs']) or 'Nincs elsődleges másolatpár; a megjegyzésben szereplő szerep/korlát alapján értékelve.'
        values=[LABEL[row['kind']],row['status'],row['name'],row['current'],row['progression'],row['extra'],refs,row['decision'],row['proposal'],row['why'],row['priority'],'Még nyitott','',refkey(r,row['kind'],row['id'])]
        for j,v in enumerate(values,1):
            c=ws.cell(rr,j,v);c.font=Font(name='Aptos',size=11,color='23332F');c.alignment=Alignment(vertical='top',wrap_text=True)
            c.fill=PatternFill('solid',fgColor='FFFFFF' if rr%2 else 'F5F8F9')
            c.border=Border(bottom=Side(style='hair',color='CCD5D9'))
        ws.cell(rr,3).font=Font(name='Aptos',size=12,bold=True,color=inf['color'])
        decisioncolor=FILL.get(row['decision'],'E8E0F4' if row['decision'].startswith(('Átadás','Átvétel','Alternatíva')) else 'FFF0CD')
        ws.cell(rr,8).fill=PatternFill('solid',fgColor=decisioncolor);ws.cell(rr,8).font=Font(name='Aptos',size=11,bold=True,color='28362E')
        if row['status']=='Új ötlet':ws.cell(rr,2).fill=PatternFill('solid',fgColor='E8E0F4')
        if row['priority']=='P0':ws.cell(rr,11).fill=PatternFill('solid',fgColor='EAB2A6')
        for j in [12,13]:ws.cell(rr,j).fill=PatternFill('solid',fgColor='FFF9E8')
        ws.cell(rr,4).comment=Comment(('Forrás: futó 4.56.0-s build, fajspecifikus felülírásokkal.\n' if row['status']=='Meglévő' else 'Új, nem beépített tervezési ötlet.\n')+row['detail'][:22000],'Roadlords')
        if row['refs']:
            sheet,rd=ROWMAP[row['refs'][0]];ws.cell(rr,7).hyperlink=f"#'{sheet}'!C{rd}";ws.cell(rr,7).font=Font(name='Aptos',size=11,color='245D9A',underline='single');ws.cell(rr,7).comment=Comment('\n'.join(row['refs']),'Kapcsolatok')
        if row['kind']=='building':ws.cell(rr,5).comment=Comment('A két L4 ág alternatíva, nem egyszerre aktív.\n'+row['detail'][:22000],'Roadlords')
        # All text visible: derive row height from wrapped content; Excel maximum is 409 points.
        lines=max(sum(max(1,math.ceil(len(z)/max(10,WIDTHS[j-1]*.92))) for z in str(values[j-1]).split('\n')) for j in range(3,11))
        ws.row_dimensions[rr].height=min(400,max(78,lines*15+12))
    end=15+len(rows);table=Table(displayName={'human':'EmberTartalom','orc':'OrkTartalom','undead':'ElottTartalom'}[r],ref=f'A15:N{end}');table.tableStyleInfo=TableStyleInfo(name='TableStyleMedium2',showFirstColumn=False,showLastColumn=False,showRowStripes=False,showColumnStripes=False);ws.add_table(table)
    validation=DataValidation(type='list',formula1='"Még nyitott,Elfogadom,Átdolgozva kérem,Elvetem,Későbbre"',allow_blank=True);validation.errorTitle='Válassz a listából';validation.error='A részletes megjegyzést a következő oszlopba írd.';validation.showErrorMessage=True;ws.add_data_validation(validation);validation.add(f'L16:L{end}')
    ws.freeze_panes='D16';ws.auto_filter.ref=f'A15:N{end}';ws.print_options.horizontalCentered=True;ws.sheet_properties.pageSetUpPr.fitToPage=True;ws.page_setup.orientation='landscape';ws.page_setup.paperSize=ws.PAPERSIZE_A3;ws.page_setup.fitToWidth=1;ws.page_setup.fitToHeight=0;ws.print_title_rows='1:3';ws.print_area=f'A1:M{end}'
    ws.oddFooter.center.text='Roadlords · tervezési munkafüzet · nem beépített változtatások';ws.oddFooter.right.text='&P / &N'

OUTPUT='Roadlords_Fajok_4.56_Melyelemzes.xlsx'
wb.save(ROOT/OUTPUT)
# Machine-readable review is the shared source for HTML and Excel.
payload={'version':D['version'],'date':'2026-10-28','intro':INTRO,'rows':ROWS,'counts':{r:{'current':sum(x['status']=='Meglévő'for x in v),'ideas':sum(x['status']=='Új ötlet'for x in v)}for r,v in ROWS.items()},'sourceCommit':'57d5366'}
(ROOT/'review.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')

# Browser version: offline, three tabs and actual cross-faction links.
page=r'''<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Roadlords – a három faj mélyelemzése</title><style>
:root{color-scheme:light;--accent:#24629b}*{box-sizing:border-box}body{margin:0;background:#eef2f1;color:#20332e;font:16px/1.5 system-ui,sans-serif}header{background:#142a24;color:#f4edcf;padding:28px max(24px,calc((100vw - 1500px)/2)) 20px}h1{margin:0 0 6px;font-size:28px}header p{margin:6px 0;max-width:1100px}.badge{display:inline-block;font-size:12px;border-radius:5px;background:#e6eef0;color:#314a4b;padding:3px 7px;margin:2px 6px 2px 0}.tabs{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}button,select,input{font:inherit}button{cursor:pointer;border:1px solid #a9bcb5;background:#fff;border-radius:6px;padding:9px 15px;color:#20332e}.tabs button[aria-selected=true]{background:var(--accent);color:#fff;border-color:#fff}main{max-width:1550px;margin:auto;padding:24px}.intro{display:grid;grid-template-columns:1fr 1fr;gap:16px}.box{background:white;border-radius:8px;padding:20px;border-top:4px solid var(--accent)}h2{margin:0 0 10px;font-size:21px}.box p{margin:0}.risk{background:#fff1d6;padding:14px 20px;margin:16px 0;border-radius:7px}.controls{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px;background:#e0e9e4;border:1px solid #becfc6;border-radius:6px}input,select{border:1px solid #9bb1a6;border-radius:5px;padding:8px;background:#fff;max-width:100%}#search{flex:1;min-width:230px}.count{margin:14px 0;color:#4d6759}.tablewrap{overflow-x:auto;border:1px solid #ced8d2;border-radius:7px}table{width:100%;min-width:1000px;border-collapse:collapse;background:#fff;table-layout:fixed}th{text-align:left;background:var(--accent);color:white;padding:13px;font-size:14px}td{padding:16px;vertical-align:top;border-bottom:1px solid #dce4df;overflow-wrap:anywhere}tr:nth-child(even){background:#f6f9f7}th:nth-child(1){width:19%}th:nth-child(2){width:25%}th:nth-child(3){width:24%}th:nth-child(4){width:32%}td h3{font-size:18px;margin:0 0 10px}.effect{white-space:pre-line}.decision{font-weight:700;padding:5px 9px;border-radius:5px;display:inline-block;margin:6px 0}.keep{background:#dcefe0}.change{background:#fff0c8}.remove{background:#f9dfdc}.idea{background:#e8dff4}.rejected{background:#e2e2e2}details{margin:13px 0}summary{cursor:pointer;font-weight:600;color:#335f72}.refs{margin-top:16px}.refs button{font-size:12px;padding:4px 7px;margin:3px 4px 3px 0;text-align:left;max-width:100%}.why{margin:8px 0 14px}.proposal{border-left:3px solid var(--accent);padding-left:12px;white-space:pre-line}.new{color:#7247a1;font-weight:600}.note{font-size:13px;color:#526759}.highlight{outline:4px solid #c99b36;outline-offset:-4px}a{color:#276b99}header a{color:#b9ddfa}@media(max-width:800px){.intro{grid-template-columns:1fr}header,main{padding:18px}.controls{position:relative}.tablewrap{overflow-x:auto}h1{font-size:23px}}@media print{header{background:#fff;color:#000}.controls,.tabs{display:none}main{max-width:none;padding:0}table{min-width:0;font-size:9px}td,th{padding:6px}.box{border:1px solid #aaa}.tablewrap{overflow:visible}details{display:block}}</style>
<header><h1>Roadlords – három faj, saját játékmód</h1><p>4.56.0 · 2026. október 28. · A jelenlegi katalógus és a tervezési javaslatok külön oszlopban. A javaslatok nincsenek a játékba beépítve.</p><p><a href="https://github.com/krisztianmatekiss/Roadlords/raw/refs/heads/reviews/faction-identity-4.56/reviews/faction-review/Roadlords_Fajok_4.56_Melyelemzes.xlsx" download>Excel-munkafüzet letöltése</a> · 3 munkalap, szűrők és saját megjegyzésoszlop. Ez a HTML internet nélkül is megnyitható.</p><nav class="tabs" aria-label="Fajok"></nav></header><main><section class="intro"></section><div class="risk"></div><p class="note">Közös alapszabályok (HP, egységtípus, elit/veterán) lehetnek közösek; a másolt épület- és kártyafunkciókat külön jelöltük. Az árak, helyfoglalás és kibocsátás nem közvetlen fajerő-rangsor. A prototípusértékek nem mért balance-eredmények.</p><div class="controls"><input id="search" placeholder="Keresés névben, hatásban, megjegyzésben…" aria-label="Keresés"><select id="kind" aria-label="Csoport"><option value="">Minden csoport</option value="unit">Egységek</option><option value="building">Épületek</option><option value="normal">Common</option><option value="legendary">Legendás</option></select><select id="status" aria-label="Állapot"><option value="">Meglévő és új</option value="Meglévő">Meglévő</option><option value="Új ötlet">Új ötletek</option></select><select id="decision" aria-label="Döntési javaslat"><option value="">Minden javaslat</option>Megtartás</option><option>Átdolgozás</option><option>Törlésjelölt</option><option>Összevonás</option><option>Szövegjavítás</option><option>Új ötlet</option><option value="Át">Átadás / átvétel</option><option>Elvetendő ötlet</option></select><label><input type="checkbox" id="cross"> Fajok közti kapcsolatok</label><button id="reset">Szűrők törlése</button></div><p class="count" aria-live="polite"></p><div class="tablewrap"><table><thead><tr><th>Tartalom és javaslat</th><th>Jelenlegi működés</th><th>L4 ágak / halmozás</th><th>Megjegyzés és új terv</th></tr></thead><tbody></tbody></table></div><p class="note">P0: biztos szöveg-/adatprobléma. P1: elsődleges faji átfedés vagy rendszerkockázat. P2: működés/balance és kipróbálandó ötlet. P3: összetettebb vagy későbbi alternatíva. Teljes katalógus: Emberek 27 épület / 28 Common / 59 legendás; Orkok 19 / 35 / 28; Élőhalottak 18 / 25 / 23. 21 egység és 56 külön megjelölt ötletjelölt is szerepel.</p></main><script id="data" type="application/json">__PAYLOAD__</script><script>
const data=JSON.parse(document.getElementById('data').textContent),labels={unit:'Egység',building:'Épület',normal:'Common',legendary:'Legendás'},all=new Map(Object.values(data.rows).flat().map(r=>[r.race+':'+r.kind+':'+r.id,r]));let race='human';const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const $=s=>document.querySelector(s);function color(d){return d==='Elvetendő ötlet'?'rejected':d.includes('megtart')||d==='Megtartás'?'keep':d==='Törlésjelölt'||d==='Szövegjavítás'?'remove':d.includes('ötlet')||d.startsWith('Át')||d.startsWith('Alternatíva')?'idea':'change'}
function clear(){['#search','#kind','#status','#decision'].forEach(s=>$(s).value='');$('#cross').checked=false}function render(){const inf=data.intro[race];document.documentElement.style.setProperty('--accent','#'+inf.color);$('.tabs').innerHTML=Object.entries(data.intro).map(([k,v])=>`<button role="tab" data-race="${k}" aria-selected="${race===k}">${esc(v.name)}</button>`).join('');$('.intro').innerHTML=`<article class="box"><h2>${esc(inf.name)} – jelenleg</h2><p>${esc(inf.now)}</p></article><article class="box"><h2>Javasolt saját irány</h2><p>${esc(inf.target)}</p></article>`;$('.risk').textContent='Kiemelt vizsgálat: '+inf.risk;const q=$('#search').value.toLocaleLowerCase('hu-HU'),kind=$('#kind').value,status=$('#status').value,decision=$('#decision').value,cross=$('#cross').checked;const rows=data.rows[race].filter(r=>(!kind||r.kind===kind)&&(!status||r.status===status)&&(!decision||r.decision.startsWith(decision))&&(!cross||r.refs.some(x=>x.split(':')[0]!==race))&&(!q||[r.name,r.current,r.progression,r.extra,r.why,r.proposal,r.decision].join(' ').toLocaleLowerCase('hu-HU').includes(q)));$('.count').textContent=`${rows.length} / ${data.rows[race].length} sor · ${data.counts[race].current} meglévő tartalom + ${data.counts[race].ideas} ötletjelölt`;$('tbody').innerHTML=rows.map(r=>`<tr id="r-${esc(r.race+'-'+r.kind+'-'+r.id)}"><td><span class="badge">${labels[r.kind]}</span><span class="badge ${r.status==='Új ötlet'?'new':''}">${esc(r.status)}</span><h3>${esc(r.name)}</h3><span class="decision ${color(r.decision)}">${esc(r.decision)}</span><p class="note">${esc(r.priority)} · ${esc(r.id)}</p><details><summary>Ár, hely és előfeltétel</summary><p class="effect">${esc(r.extra)}</p></details></td><td class="effect">${esc(r.current)}<details><summary>Szintértékek / forrásrészlet</summary><p class="note effect">${esc(r.detail)}</p></details></td><td class="effect">${esc(r.progression)}</td><td><p class="why">${esc(r.why)}</p><div class="proposal">${esc(r.proposal)}</div><div class="refs">${r.refs.map(x=>{const t=all.get(x);return `<button data-ref="${esc(x)}">${esc(data.intro[t.race].name+' / '+t.name)}</button>`}).join('')}</div></td></tr>`).join('')}
document.addEventListener('click',e=>{const tab=e.target.closest('[data-race]');if(tab){race=tab.dataset.race;render()}const ref=e.target.closest('[data-ref]');if(ref){const key=ref.dataset.ref,[r,k,i]=key.split(':');race=r;clear();render();const target=document.getElementById('r-'+r+'-'+k+'-'+i);target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.add('highlight');setTimeout(()=>target.classList.remove('highlight'),2200)}});['#search','#kind','#status','#decision','#cross'].forEach(s=>$(s).addEventListener(s==='#search'?'input':'change',render));$('#reset').onclick=()=>{clear();render()};render();
</script></html>'''
page=page.replace('__PAYLOAD__',json.dumps(payload,ensure_ascii=False).replace('<','\\u003c'))
(ROOT/'Roadlords_Fajok_Attekintes.html').write_text(page)

# GitHub-readable fallback for opening without Excel or downloading an HTML file.
for r,rows in ROWS.items():
    inf=INTRO[r];lines=['# '+inf['name']+' — részletes fajterv','', '**Jelenlegi játék:** '+inf['now'],'','**Javasolt saját irány:** '+inf['target'],'','**Fontos:** minden döntés és új hatás javaslat, még nincs beépítve. A számok 4.56.0-ból származnak; az új ötletek próbaértékek.','', '[← Vissza a munkafüzethez](README.md)','']
    for k in LABEL:
        lines+=['## '+LABEL[k]+' készlet','']
        for row in [a for a in rows if a['kind']==k]:
            lines+=['<a id="'+row['kind']+'-'+row['id']+'"></a>', '<details>', '<summary><strong>'+html.escape(row['name'])+'</strong> · '+html.escape(row['status'])+' · '+html.escape(row['decision'])+' · '+row['priority']+'</summary>','', '**Jelenlegi hatás**','',row['current'],'','**L4 / halmozás**','',row['progression'],'','**Ár / hely / előfeltétel**','',row['extra'],'','**Megjegyzés**','',row['why'],'','**Javasolt új működés**','',row['proposal'],'']
            if row['refs']:lines+=['**Kapcsolódó tartalom:** '+', '.join('['+NAMES[RECORDS[x]['race']]+' – '+RECORDS[x]['name']+']('+RECORDS[x]['race']+'.md#'+RECORDS[x]['kind']+'-'+RECORDS[x]['id']+')'for x in row['refs']),'']
            lines+=['</details>','']
    (ROOT/(r+'.md')).write_text('\n'.join(lines))
summary={'worksheets':wb.sheetnames,'currentRows':len(NOTES),'ideaRows':len(IDEAS),'rows':sum(map(len,ROWS.values())),'ideasByFaction':{r:dict(Counter(i['kind']for i in IDEAS if i['race']==r))for r in INTRO},'xlsxBytes':(ROOT/OUTPUT).stat().st_size}
(ROOT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
