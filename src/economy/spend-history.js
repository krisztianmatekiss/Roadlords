import { assetUrl } from '../assets/urls.js';
export function initializeEconomySpendHistory(runtime) {
  for (const [id, description] of Object.entries({
    "overproduction": "Minden összesen 500 egységnyi túltermelt nyersanyag után minden jelenlegi és jövőbeli egységed +1% sebzést kap. Nincs felső korlát.",
    "strategic_superiority": "Azonnal kapsz 3 extra picket, +5 újrasorsolást és +3 kitiltást. Korlátlanul halmozható.",
    "stockpile_production": "Minden teljes 500 jelenleg tárolt össznyersanyag után minden katonai termelő +3% gyártási sebességet kap.",
    "double_assault": "A hullám másolatai 3 saját támadásig élnek, időkorlát nélkül. Megölhetők, sereglimitet foglalnak. Épületütés is számít.",
    "campaign_feast": "Szomszédos Kocsma–Gyülekezőtér: fél Kocsma-sebzésbónusz állandóan. A nyitó támadásokon a teljes bónusz jár, a kettő nem adódik össze.",
    "long_training": "A főhelyőrségben, kiengedési sorban vagy Gyülekezőtérben összesen 20 másodpercet váró egység Veteránná válik: +50% HP és +50% sebzés.",
    "factory_network": "Normál egységgyártáskor minden közvetlenül szomszédos aktív katonai termelő +15% gyártási előrehaladást kap.",
    "arm_the_people": "Minden Favágó, Kővágó és Farm 40 másodpercenként kiállít 1 ingyenes Kardost a normál termelése mellett.",
    "no_food": "Az egységgyártás többé nem fogyaszt Élelmet, viszont minden egység gyártási ideje +25%.",
    "house_militia": "Minden Lakóház a tényleges úti sereglimit-bónuszának 100%-át helyőrségkapacitásként is megadja.",
    "sword_execute": "Kardos: 4% kivégzési esély az elsődleges célpontra. +4 százalékpont/stack, max. 5× (20%). Csak egységre hat."
  })) {
    const p = runtime.LEGENDARY.find(x => x.id === id);
    if (p) p.description = description;
  }
  runtime.resourceSpendHistory38 = undefined;
}
