// Live typography is placed in these measured panels. Faction ornament and
// rarity trim are independent, so illustrations never need a recoloured copy.
export function factionCardFrame(race) {
  if (!['orc','undead'].includes(race)) return '';
  const orc=race==='orc', light=orc?'#867663':'#8c9692';
  const ornament=orc
    ? '<path d="M4 18 8 23 5 29M96 18 92 23 95 29M4 80 8 86 5 92M96 80 92 86 95 92" fill="#d8cba7" stroke="#534635" stroke-width=".5"/>'
    : '<path d="m4 20 3 6-3 6m92-12-3 6 3 6M4 81l3 6-3 6m92-12-3 6 3 6" fill="none" stroke="#a4b0a6" stroke-width=".6"/><path d="M46 144q0-5 4-5t4 5l-2 2h-4Z" fill="#b8c2b3"/><path d="m48 142 1 1m2-1 1 1m-3 2h2" stroke="#273536" stroke-width=".8"/>';
  return `<svg class="factionCardFrame" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><path d="M6 1H94L99 6V144L94 149H6L1 144V6Z M8 18V86H92V18Z" fill="none" fill-rule="evenodd" stroke="#101715" stroke-width="1.4"/><path d="M7 3H93L97 7V143L93 147H7L3 143V7Z M7 17V87H93V17Z" fill="none" stroke="var(--card-border)" stroke-width=".85"/><path d="M9 3H91V14H9Z" fill="none" stroke="${light}" stroke-width=".35"/><path d="M8 91H92V141H8Z" fill="none" stroke="${light}" stroke-width=".45"/><path d="M11 93H89M11 139H89" stroke="#b7aa83" stroke-opacity=".2" stroke-width=".3"/>${ornament}<path d="m40 144 4-2h12l4 2-4 3H44Z" fill="#1a211e" stroke="var(--card-border)" stroke-width=".4"/></svg>`;
}
