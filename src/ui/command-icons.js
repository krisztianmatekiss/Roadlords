const svg=paths=>`<svg viewBox="0 0 32 32" aria-hidden="true">${paths}</svg>`;
export const CATEGORY_ICONS={
 all:svg('<path d="M16 16C10 4 2 8 2 16s8 12 14 0c6-12 14-8 14 0s-8 12-14 0Z" fill="none" stroke="currentColor" stroke-width="3.2"/>'),
 economy:svg('<path d="M7 14h18l3 13H4Z" fill="#bf8b39" stroke="#ffe19a" stroke-width="1.3"/><path d="M10 14V8m6 6V4m6 10V8" stroke="#f4d274" stroke-width="2"/><path d="m10 10-5-4 1 7 4 2 4-3-1-7Zm6-3-4-5 1 7 3 2 4-4-1-6Zm6 3-3-4-1 6 4 3 5-3 1-7Z" fill="#e7bd56"/>'),
 military:svg('<path d="m5 3 10 10-4 4L2 6Zm22 0L17 13l4 4 9-11Z" fill="#f3e4d7" stroke="#fff6dc"/><path d="m9 16 13 13m1-13L10 29" stroke="#a47745" stroke-width="4"/><path d="m7 20 7-7m4 0 7 7" stroke="#e8c571" stroke-width="3"/>'),
 support:svg('<path d="m16 2 12 5v10c-1 7-6 10-12 14C10 27 5 24 4 17V7Z" fill="#6379a1" stroke="#b8d2f3" stroke-width="1.5"/><path d="m16 7 2.5 6 6.5 1-5 4 1 7-5-3.5L11 25l1-7-5-4 6.5-1Z" fill="#ffe09a"/>'),
};
export const categoryMarkup=(cat,key,label)=>`${CATEGORY_ICONS[cat]}<span class="tabHotkey">${key}</span><span class="srOnly">${label}</span>`;
export const GATE_ICONS={
 open:svg('<path d="M5 29V12a11 11 0 0 1 22 0v17H5Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m11 28-7-4V10l7 4Zm10 0 7-4V10l-7 4Z" fill="currentColor"/><path d="M16 13v10m-3-3 3 3 3-3" fill="none" stroke="currentColor" stroke-width="2"/>'),
 closed:svg('<path d="M5 29V12a11 11 0 0 1 22 0v17Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 12v16m6-18v18m6-16v16M7 18h18m-18 7h18" stroke="currentColor" stroke-width="2.5"/>'),
 auto:svg('<path d="M7 27V13a9 9 0 0 1 18 0v14Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 17a6 6 0 0 1 10-3m0-4v5h-5M21 22a6 6 0 0 1-10 2m0 4v-5h5" fill="none" stroke="currentColor" stroke-width="2"/>'),
};
