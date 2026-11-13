const icons={
 solo:'<path d="M5 28V12h5V6h5v6h6V6h5v6h5v16ZM13 28v-8h10v8"/><path d="M18 6V1l9 3-9 3"/>',
 multi:'<path d="m4 4 8 2 17 21-4 4L7 11Zm28 0-8 2L7 27l4 4L29 11ZM3 25l8 8m14 0 8-8"/>',
 tests:'<path d="M3 28V6l10 4 10-4 10 4v22l-10-4-10 4ZM13 10v22M23 6v22"/><path d="m15 20 4 4 6-10"/>',
 settings:'<path d="m15 2 7 0 2 5 5 2 5-1 2 6-4 4 0 5 4 4-3 6-5-1-5 2-2 4h-7l-2-5-5-2-5 1-2-6 4-4v-5l-4-4 3-6 5 1 5-2Z"/><circle cx="18" cy="20" r="6"/>',
 codex:'<path d="M3 5q8-5 15 2 7-7 15-2v25q-8-4-15 2-7-6-15-2ZM18 7v25M7 11l6 1M7 17l6 1M23 12l6-1M23 18l6-1"/>'
};
export function installCommandTableMenu(R){
 const lobby=R.MP.lobby,brand=lobby.querySelector('.menuBrand'),definitions=[['mpSolo','solo','EGYJÁTÉKOS','Építs birodalmat. Törd át a védelmet.'],['mpOpenMulti','multi','TÖBBJÁTÉKOS','Egy barát. Két város. Egyetlen út.'],['roadTestsMenu','tests','TESZTEK','Figyeld meg a hadvezérek párbaját.'],['rlOpenSettings','settings','BEÁLLÍTÁSOK','Hang és megjelenítés'],['rlOpenCodex','codex','LEXIKON','A hadvezetés kézikönyve']];
 brand.insertAdjacentHTML('beforeend','<p class="atlasEyebrow">A HADVEZÉREK ATLASZA</p><p class="atlasTagline">A győzelem a városodban kezdődik.</p>');
 for(const [id,icon,title,description]of definitions){const button=R.$('#'+id);button.dataset.atlasAction=icon;button.setAttribute('aria-label',title);button.innerHTML=`<svg class="atlasActionIcon" viewBox="0 0 38 40" aria-hidden="true">${icons[icon]}</svg><span class="atlasActionText"><b>${title}</b><small>${description}</small></span><span class="atlasActionArrow" aria-hidden="true">›</span>`;}
 const activate=()=>{const modern=!!R.battleLayout.active;lobby.classList.toggle('commandTableMenu',modern);if(modern){lobby.classList.remove('intro-pending','intro-revealing');lobby.classList.add('intro-ready');}};
 const mode=R.battleLayout.setMode;R.battleLayout.setMode=(...args)=>{const value=mode(...args);activate();return value;};activate();
}
