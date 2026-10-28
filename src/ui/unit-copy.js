// Short roles and abilities for the encyclopedia. Rules and values live in combat data.
import { ARMY_TEMPO } from '../data/unit-balance.js';
import { MAGE_SECONDARY_DAMAGE } from '../data/combat-balance.js';
export const UNIT_COPY = {
  swordsman: {role:'Közelharcos', ability:'Olcsó gyalogság az első sorba.'},
  spearman: {role:'Páncéltörő gyalogos', ability:'Lovasság és nehéz egységek ellen erős.', details:['A közelharcosok többségénél messzebbre ér el.']},
  archer: {role:'Távolsági gyalogos', ability:'Biztonságos távolságból lövi az ellenséget.', details:['Közelről gyengébben sebez.']},
  knight: {role:'Lovasság', ability:'Gyors, nagy életerejű közelharcos.'},
  priest: {role:'Gyógyító', ability:'A közeli sérült szövetségeseket gyógyítja.'},
  catapult: {role:'Ostromgép', ability:'Messziről rombolja az épületeket.'},
  mage: {role:'Területsebző mágus', ability:'Tűzgolyója a célpont körüli ellenségeket is sebzi.',details:[`A környező célpontok az elsődleges sebzés ${MAGE_SECONDARY_DAMAGE*100}%-át kapják.`]},
  orc_warrior: {role:'Nehéz közelharcos', ability:'Nagy életerejével tartja a frontot.'},
  orc_berserker: {role:'Rohamgyalogos', ability:'Sebesülten gyorsabban támad.', details:['Minden 2% hiányzó életerőért +1% támadási sebesség.']},
  orc_goblin: {role:'Távolsági gyalogos', ability:'Gyorsan támad, de kevés az életereje.'},
  orc_warg: {role:'Lovasság', ability:'Lándzsadobással nyit, majd közelharcban küzd.', details:['Nyitó lándzsa: 60 sebzés, 230 hatótáv.','Épületek ellen a dobás gyengébb, és nem lehet kritikus.']},
  orc_shaman: {role:'Átokmágus', ability:'Találatonként véletlen átkot okoz 4 mp-re.', details:['Gyengeség: −20% sebzés.','Sorvadás: −20% maximális életerő.','Kimerültség: −25% támadási sebesség.','Sebezhetőség: +20% kapott sebzés.','Vakság: 25% melléütési esély.','Azonos átoknál az időtartam frissül. A Sorvadás lejárta nem gyógyít.']},
  orc_ram: {role:'Ostromgép', ability:'Épületek ellen erős. −50% kapott fizikai sebzés.'},
  orc_troll: {role:'Területsebző ostromegység', ability:'Csapásai a célpont körül is sebeznek.', details:['Másodlagos sebzés: 35; területi sugár: 55.','4 sereghelyet és 4 helyőrségi férőhelyet foglal.']},
  und_skeleton: {role:'Közelharcos', ability:'−25% kapott sebzés távolsági fegyverekből.'},
  und_skeleton_archer: {role:'Távolsági csontváz', ability:'−25% kapott sebzés távolsági fegyverekből.'},
  und_zombie: {role:'Mérgező közelharcos', ability:'Halálakor 4 méregpontot okoz a közelében.', details:['A halálkori méreg hatótávja: 30.']},
  und_ghost: {role:'Kitérő közelharcos', ability:'40% eséllyel kivédi a támadást.', details:['Területi sebzés elől is kitér. A kivédett támadás állapothatásai sem érik.']},
  und_necromancer: {role:'Idézőmágus', ability:`${ARMY_TEMPO.necroSummonInterval.toLocaleString('hu-HU')} mp-enként 3 Csontvázat idéz 10 mp-re.`, details:['Az idézett egységek nem foglalnak sereghelyet.']},
  und_vampire: {role:'Életlopó közelharcos', ability:'Az okozott sebzés 30%-ából gyógyul.'},
  und_lich: {role:'Életerőszívó mágus', ability:'Erősödő sugarakkal sebez és gyógyul.', details:['5 mp-enként új ellenségre kapcsol sugarat.','Sugáronként 5 sebzés/mp; másodpercenként +2 sebzés/mp.','A sugár a célpont haláláig tart. Az okozott sebzés teljes értékével gyógyul.']},
};
