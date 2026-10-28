"""Standalone six-column edition of the existing, unchanged faction analysis."""
from pathlib import Path
from collections import Counter
import json, re, textwrap, html, math
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'review.json').read_text())
HEADERS = ['Csoport', 'Név', 'Jelenlegi működés / új ötlet', 'L4 ágak / halmozás', 'Javaslatom és indoka', 'Saját megjegyzésed']
WIDTHS = [13, 25, 53, 50, 67, 26]
LABELS = {'unit': 'Egység', 'building': 'Épület', 'normal': 'Common', 'legendary': 'Legendás'}
RECORDS = {f"{race}:{r['kind']}:{r['id']}": r for race, rows in DATA['rows'].items() for r in rows}
PATH = ROOT / 'Roadlords_Fajok_Egyszeru.xlsx'

def clean(s):
    changes = {
        'a heavy címke': 'a nehéz egység besorolás', 'heavy címkével': 'nehéz egységként',
        'heavy célpontok': 'nehéz célpontok', 'heavy ostromegység': 'nehéz ostromegység',
        'spawner': 'kiképzőépület', 'alapbatch': 'alap képzési adag',
        'HP-sebzés': 'életerősebzés', 'DPS': 'másodpercenkénti sebzés',
        'incoming': 'kapott', 'actor': 'aktív egység',
    }
    for a,b in changes.items(): s=s.replace(a,b)
    return re.sub(r'\n{3,}', '\n\n', s).strip()

def one_effect(ref):
    other=RECORDS[ref]
    text=other['current'] if other['status']=='Meglévő' else other['proposal'].split('\n\nKorlát')[0]
    if other['id']=='orc_hunt' and other['kind']=='legendary':
        text='Warg-ölés után új, ingyenes lándzsadobás.'
    # The comparison is written here, rather than linking to a different row.
    first=re.split(r'(?<=[.!?])\s+|\n',text)[0]
    if len(first)>210: first=text # Never cut a sentence halfway through.
    race=DATA['intro'][other['race']]['name']
    return f"{race} – {other['name']}: {first}"

def compact(r):
    idea=r['status']=='Új ötlet'
    category=('Új ' if idea else '')+LABELS[r['kind']]
    current=r['proposal'].split('\n\nKorlát / értelmezés:')[0] if idea else r['current']
    extra=r['extra']
    extra=extra.replace('Több példány építhető az alapdefiníció szerint.', '')
    extra=re.sub(r'\nL1 kibocsátás/mező:.*', '',extra)
    extra=extra.replace('\nÁr: egy megfelelő választás, nincs külön nyersanyagár.','')
    extra=extra.replace('Nincs külön épületfeltétel.','Nincs külön feltétel.')
    if r['kind']=='unit':
        extra=extra.replace('HP:', 'Életerő:').replace('Képzés L1/L2/L3:', 'Képzés (1./2./3. szint):')
        current+='\n\n'+extra
        progression='—'
    else:
        current+='\n\n'+extra
        progression=r['progression']
    if not idea and r['kind'] in ('normal','legendary'):
        # Keep the useful stacking rule and numerical change; remove repeated uptake boilerplate.
        progression=progression.replace('Egyszer választható.', 'Egyszer vehető fel.')
    proposal=r['proposal']
    if r['kind']=='unit':
        proposal='' # Repeated disclaimer wasn't a proposal about this unit.
    elif idea:
        proposal='' # Actual new effect is already in the main effect column.
    decision={'Szerep megtartása':'Megtartanám','Megtartás':'Megtartanám','Törlésjelölt':'Törölném',
              'Átdolgozás':'Átdolgoznám','Összevonás':'Összevonnám', 'Szövegjavítás':'Hibás leírás: javítani',
              'Elvetendő ötlet':'Ezt az ötletet elvetném'}.get(r['decision'],r['decision'])
    notes=decision+'\n'+('\n\n'.join(x for x in [proposal,r['why']] if x))
    comparisons=[one_effect(ref) for ref in r['refs'] if RECORDS[ref]['race']!=r['race']]
    if comparisons: notes+='\n\nHasonló másik népnél:\n'+'\n'.join(comparisons)
    return [category,r['name'],clean(current),clean(progression),clean(notes),'']

ROWS={race:[compact(r) for r in rows] for race,rows in DATA['rows'].items()}
wb=Workbook(); wb.remove(wb.active)
wb.properties.title='Roadlords – egyszerű, önálló fajáttekintés'
wb.properties.creator='Roadlords'
wb.properties.description='Három fül, hat oszlop. Nincs hivatkozás, képlet vagy külső adatkapcsolat.'
wb.calculation.fullCalcOnLoad=False
FILL={'Megtartás':'E8F3E9','Szerep megtartása':'E8F3E9','Törlésjelölt':'FBE5E2','Elvetendő ötlet':'E8E8E8'}

for race, rows in ROWS.items():
    intro=DATA['intro'][race]; ws=wb.create_sheet(intro['name'])
    ws.sheet_view.showGridLines=False; ws.sheet_view.zoomScale=100
    ws.sheet_properties.tabColor=intro['color']
    for col,width in enumerate(WIDTHS,1): ws.column_dimensions[get_column_letter(col)].width=width
    def band(row,value,fill='F1F4F6',color='24343D',height=40,size=12):
        ws.merge_cells(start_row=row,start_column=1,end_row=row,end_column=6)
        c=ws.cell(row,1,value);c.fill=PatternFill('solid',fgColor=fill)
        c.font=Font(name='Calibri',size=size,color=color,bold=row==1)
        c.alignment=Alignment(wrap_text=True,vertical='center',indent=1)
        ws.row_dimensions[row].height=height
    band(1,intro['name'].upper()+' – '+intro['tagline'],intro['color'],'FFFFFF',36,17)
    band(2,intro['now'],height=45)
    band(3,intro['target'].replace('Javasolt egyediség:','Javasolt irány:'),'EDF4EA',height=46)
    band(4,'Fő gondok: '+intro['risk'],'FFF1DA',height=40)
    n=Counter(x['status'] for x in DATA['rows'][race])
    band(5,f"4.56.0 · 2026. október 28. · {n['Meglévő']} meglévő tartalom + {n['Új ötlet']} ötlet. A javaslatok még nincsenek beépítve; az ötletek számai próbaértékek.",height=25,size=11)
    band(6,'A táblázat önálló: nincsenek benne hivatkozások vagy külső kapcsolatok. A C–D oszlop írja le a tartalmat, az E oszlop az értékelést. Az „Új” sorok még csak ötletek.',height=28,size=11)
    band(7,'A fejléceknél szűrhetsz; az utolsó oszlopba írhatsz. HP = életerő; mp = másodperc; L4 = 4. épületszint. Az értékek bónuszok nélküliek. Az elit/veterán mindhárom népnél közös alapállapot.',height=28,size=11)
    ws.row_dimensions[8].height=8
    for j,v in enumerate(HEADERS,1):
        c=ws.cell(9,j,v);c.font=Font(name='Calibri',size=12,bold=True,color='FFFFFF')
        c.fill=PatternFill('solid',fgColor=intro['color']);c.alignment=Alignment(wrap_text=True,vertical='center',indent=1)
    ws.row_dimensions[9].height=32
    for idx,values in enumerate(rows,10):
        original=DATA['rows'][race][idx-10]
        is_new=original['status']=='Új ötlet'
        bg='F8F5FC' if is_new else ('F5F7F9' if idx%2 else 'FFFFFF')
        for col,value in enumerate(values,1):
            c=ws.cell(idx,col,value);c.font=Font(name='Calibri',size=12,color='202D35',bold=col==2)
            c.fill=PatternFill('solid',fgColor='FFFCEB' if col==6 else bg)
            c.alignment=Alignment(wrap_text=True,vertical='top',indent=1)
            c.border=Border(bottom=Side(style='hair',color='D4DDE2'))
        ws.cell(idx,5).fill=PatternFill('solid',fgColor=FILL.get(original['decision'],'F1EAF9' if is_new else 'FFF2D9'))
        lines=max(sum(max(1,math.ceil(len(line)/(WIDTHS[c]*0.82))) for line in value.split('\n')) for c,value in enumerate(values))
        ws.row_dimensions[idx].height=min(409.5,max(64,lines*16+14))
    ws.freeze_panes='C10'
    table=Table(displayName='Simple_'+race,ref=f'A9:F{ws.max_row}')
    table.tableStyleInfo=TableStyleInfo(name='TableStyleMedium2',showRowStripes=False,showColumnStripes=False)
    ws.add_table(table)
    ws.print_options.horizontalCentered=True
    ws.sheet_properties.pageSetUpPr.fitToPage=True
    ws.page_setup.orientation='landscape';ws.page_setup.paperSize=ws.PAPERSIZE_A3
    ws.page_setup.fitToWidth=1;ws.page_setup.fitToHeight=0
    ws.print_title_rows='9:9';ws.print_area=f'A1:F{ws.max_row}'
    ws.sheet_view.selection[0].activeCell='A1';ws.sheet_view.selection[0].sqref='A1'
wb.save(PATH)

# A matching offline reader also allows checking the full horizontal layout.
tabs=''.join(f'<button type="button" data-race="{race}" aria-selected="{str(i==0).lower()}">{intro["name"]}</button>' for i,(race,intro) in enumerate(DATA['intro'].items()))
payload=json.dumps({'intro':DATA['intro'],'rows':ROWS},ensure_ascii=False).replace('</','<\\/')
doc='''<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roadlords – egyszerű fajáttekintés</title>
<style>*{box-sizing:border-box}body{margin:0;background:#edf1f4;color:#202d35;font:15px/1.5 system-ui,Arial,sans-serif}main{max-width:1710px;margin:auto;padding:20px}h1{font-size:26px;margin:6px 0}p{margin:7px 0}.tabs,.tools{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0}button,input,select{font:inherit;padding:8px 12px;border:1px solid #b5c2cb;border-radius:6px;background:white}button[aria-selected=true]{background:#24445e;color:white}input{min-width:220px;flex:1}section{background:white;padding:15px;border-radius:8px;border-top:5px solid var(--race)}.direction{background:#edf4ea;padding:10px}.hint{font-size:13px;color:#4c5b65}.table-wrap{margin-top:16px;overflow:auto}table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:14px}col:nth-child(1){width:6%}col:nth-child(2){width:12%}col:nth-child(3){width:23%}col:nth-child(4){width:21%}col:nth-child(5){width:28%}col:nth-child(6){width:10%}th{background:#24445e;color:white;text-align:left;padding:12px 9px;position:sticky;top:0}td{white-space:pre-wrap;overflow-wrap:anywhere;vertical-align:top;padding:12px 9px;border-bottom:1px solid #d4dde2}tbody tr:nth-child(even){background:#f5f7f9}td:nth-child(2){font-weight:700}td:last-child{background:#fffceb}tr.new{background:#f8f5fc}td.note{background:#fff2d9}small{font-size:12px}@media(max-width:1000px){table{min-width:1000px}main{padding:10px}}@media print{.tools,.tabs{display:none}main{max-width:none;padding:0}th{position:static}table{font-size:10px}td{padding:6px}}</style>
<main><h1>Roadlords – egyszerű fajáttekintés</h1><p class="hint">4.56.0 · 2026. október 28. · Hat oszlop, három nép. Önálló fájl, nincs hálózati letöltés vagy hivatkozás.</p><nav class="tabs">__TABS__</nav><section id="intro"></section><div class="tools"><select id="kind"><option value="">Minden csoport</option><option>Egység</option><option>Épület</option><option>Common</option><option>Legendás</option></select><select id="status"><option value="">Meglévő + új</option><option value="current">Csak meglévő</option><option value="new">Csak új ötletek</option></select><input id="search" type="search" placeholder="Keresés a szövegben…"><button id="reset">Szűrők törlése</button></div><p id="count" class="hint"></p><div class="table-wrap"><table><colgroup><col><col><col><col><col><col></colgroup><thead><tr>__HEADERS__</tr></thead><tbody></tbody></table></div><p class="hint">Az értékelés javaslat, nincs beépítve. Az új számok próbaértékek. A sárga utolsó oszlopba itt is írhatsz, de a böngészőben beírt szöveg nem kerül mentésre; tartós megjegyzéshez az Excel-fájlt használd.</p></main>
<script>const data=__PAYLOAD__;let race='human';const $=s=>document.querySelector(s);function render(){const info=data.intro[race];document.documentElement.style.setProperty('--race','#'+info.color);$('#intro').replaceChildren();for(const [tag,text,cls]of [['h2',info.name+' – '+info.tagline,''],['p',info.now,''],['p',info.target,'direction'],['p','Fő gondok: '+info.risk,'hint']]){let e=document.createElement(tag);e.textContent=text;e.className=cls;$('#intro').append(e)}document.querySelectorAll('[data-race]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.race===race)));const q=$('#search').value.toLocaleLowerCase('hu'),kind=$('#kind').value,status=$('#status').value,rows=data.rows[race].filter(r=>(!kind||r[0].replace('Új ','')===kind)&&(!status||(status==='new')===r[0].startsWith('Új '))&&r.join(' ').toLocaleLowerCase('hu').includes(q));$('tbody').replaceChildren();for(const values of rows){const tr=document.createElement('tr');if(values[0].startsWith('Új '))tr.className='new';values.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===4)td.className='note';if(i===5){td.contentEditable='true';td.setAttribute('aria-label','Saját megjegyzés: '+values[1])}tr.append(td)});$('tbody').append(tr)}$('#count').textContent=rows.length+' sor / '+data.rows[race].length+' a kiválasztott népnél. HP = életerő; mp = másodperc; L4 = 4. épületszint.'}document.querySelectorAll('[data-race]').forEach(b=>b.onclick=()=>{race=b.dataset.race;render()});for(const id of ['kind','status','search'])$('#'+id).addEventListener('input',render);$('#reset').onclick=()=>{for(const id of ['kind','status','search'])$('#'+id).value='';render()};render();</script></html>'''
doc=doc.replace('__TABS__',tabs).replace('__HEADERS__',''.join('<th>'+html.escape(x)+'</th>' for x in HEADERS)).replace('__PAYLOAD__',payload)
(ROOT/'Roadlords_Fajok_Egyszeru.html').write_text(doc)

# Reopen the actual download and check it contains all original entries and no dependencies.
check=load_workbook(PATH)
assert check.sheetnames==['Emberek','Orkok','Élőhalottak']
for race,ws in zip(ROWS,check.worksheets):
    assert ws.max_column==6 and ws.max_row==9+len(ROWS[race])
    assert len(ws.tables)==1 and ws.freeze_panes=='C10'
    for row in ws:
        for cell in row:
            assert cell.hyperlink is None and cell.data_type!='f' and cell.comment is None
    assert not any(c.hidden for c in ws.column_dimensions.values())
assert not check._external_links
print(json.dumps({'rows':sum(map(len,ROWS.values())),'sheets':check.sheetnames,'columns':6,'estimatedWidthAt100PercentPx':sum(int(w*7+5)for w in WIDTHS),'bytes':PATH.stat().st_size},ensure_ascii=False))
