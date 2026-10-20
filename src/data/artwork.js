import { assetUrl } from '../assets/urls.js';
export function initializeDataArtwork(runtime) {
  runtime.BUILDING_IMAGES = {
    "keep": assetUrl("art/keep-688ac739acd5cd5c.webp"),
    "lumber": assetUrl("art/lumber-90d246fca28fb280.webp"),
    "stonecutter": assetUrl("art/stonecutter-60bcd5d7cb194c60.webp"),
    "farm": assetUrl("art/farm-1eadeee926b51a38.webp"),
    "warehouse": assetUrl("art/warehouse-c558a5904fa726f4.webp"),
    "barracks": assetUrl("art/barracks-20cab4b83fe32aa1.webp"),
    "archery": assetUrl("art/archery-af90d3264469201a.webp"),
    "spearhall": assetUrl("art/spearhall-6c71c73a2ac97765.webp"),
    "stable": assetUrl("art/stable-bd96c8f9114b93da.webp"),
    "temple": assetUrl("art/temple-14bde3c21208a99e.webp"),
    "siegeworks": assetUrl("art/siegeworks-7e91cb77b7a13e03.webp"),
    "magetower": assetUrl("art/magetower-44fc7af2157df867.webp"),
    "guildhouse": assetUrl("art/guildhouse-635f19b0f22f04d1.webp"),
    "market": assetUrl("art/market-b089a1a805d085f7.webp"),
    "builders": assetUrl("art/builders-39fe4d0d95c88b81.webp"),
    "townhall": assetUrl("art/townhall-edb44ed6eeef124a.webp"),
    "rally": assetUrl("art/rally-be075aced5916476.webp"),
    "tavern": assetUrl("art/tavern-be24e4bd68488a39.webp"),
    "guardhouse": assetUrl("art/guardhouse-74512351d756dc3b.webp")
  };
  runtime.CARD_IMAGES = {
    "archery": assetUrl("art/archery-d15cf851931ac727.webp"),
    "barracks": assetUrl("art/barracks-b922ccf140db8121.webp"),
    "builders": assetUrl("art/builders-681805cff2e9c343.webp"),
    "farm": assetUrl("art/farm-0abfde4479b31093.webp"),
    "guardhouse": assetUrl("art/guardhouse-fee8d4902a11c49c.webp"),
    "guildhouse": assetUrl("art/guildhouse-b2308240feca0d06.webp"),
    "keep": assetUrl("art/keep-26379677c50b344b.webp"),
    "lumber": assetUrl("art/lumber-d0e8ff55376b041b.webp"),
    "magetower": assetUrl("art/magetower-8aa7b9568deb62d7.webp"),
    "market": assetUrl("art/market-d92481564fd64957.webp"),
    "rally": assetUrl("art/rally-67ebd43145075f0c.webp"),
    "siegeworks": assetUrl("art/siegeworks-33f652b96ea25000.webp"),
    "spearhall": assetUrl("art/spearhall-40b4102bfe148033.webp"),
    "stable": assetUrl("art/stable-dec44fcaf4dc6996.webp"),
    "stonecutter": assetUrl("art/stonecutter-28978b28e5f1fecc.webp"),
    "tavern": assetUrl("art/tavern-ca8f8930257dd6e0.webp"),
    "temple": assetUrl("art/temple-b11271089405678e.webp"),
    "townhall": assetUrl("art/townhall-691f628c6e5f52c3.webp"),
    "warcenter": assetUrl("art/warcenter-e8314827cfa66f11.webp"),
    "warehouse": assetUrl("art/warehouse-92d2f15780abce46.webp")
  };
  runtime.RESOURCE_IMAGES = {
    "food": assetUrl("art/food-5a55b60020d4aba8.webp"),
    "stone": assetUrl("art/stone-7b62fafa3d25f326.webp"),
    "wood": assetUrl("art/wood-ad426a1dcdc5e609.webp")
  };
  runtime.BUILDING_IMAGES.warcenter = assetUrl("art/image-c3002f6fa54315a0.webp");
  runtime.RESOURCE_NAMES = {
    wood: 'Fa',
    stone: 'Kő',
    food: 'Élelem'
  };
  runtime.CATEGORY_NAMES = {
    economy: 'GAZDASÁG',
    military: 'HADSEREG',
    support: 'TÁMOGATÁS',
    defense: 'VÉDELEM'
  };
  runtime.UNIT_IMAGES = {
    "swordsman": assetUrl("art/swordsman-8aff42af8e9f60ec.webp"),
    "archer": assetUrl("art/archer-bb8cbbcd0ca762ae.webp"),
    "spearman": assetUrl("art/spearman-b5c357624432cb16.webp"),
    "knight": assetUrl("art/knight-1b097f4bc7c4c122.webp"),
    "priest": assetUrl("art/priest-a16efae80c72b241.webp"),
    "catapult": assetUrl("art/catapult-769ae291300eb7cf.webp"),
    "mage": assetUrl("art/mage-faaa5bfec9ce9a5c.webp")
  };
  runtime.PICK_UNIT_IMAGES = {
    "cav_dmg": "knight",
    "cav_hp": "knight",
    "sie_dmg": "catapult",
    "sie_hp": "catapult",
    "sword_as": "swordsman",
    "spear_counter": "spearman",
    "archer_range": "archer",
    "knight_move": "knight",
    "priest_heal": "priest",
    "cat_build": "catapult",
    "mage_aoe": "mage",
    "sacred_vow": "priest",
    "cavalry_charge": "knight",
    "swordsman_triple": "swordsman",
    "phalanx": "spearman",
    "catapult_aoe": "catapult",
    "mage_ward": "mage",
    "archer_skirmish": "archer",
    "momentum": "knight",
    "barracks_spear": "spearman",
    "barracks_archer": "archer",
    "arm_the_people": "swordsman",
    "mage_proliferation": "mage",
    "mage_triple": "mage",
    "holy_wave": "priest",
    "holy_retribution": "priest",
    "catapult_range_as": "catapult",
    "catapult_knockback": "catapult",
    "sword_execute": "swordsman",
    "sword_whirlwind": "swordsman",
    "spear_pierce": "spearman",
    "spear_brace": "spearman",
    "archer_volley": "archer",
    "archer_close_combat": "archer",
    "knight_dismount": "knight"
  };
  runtime.PICK_IMAGES = {
    "spawn_speed": assetUrl("art/spawn-speed-be6ee8fdafd5a33a.webp"),
    "production": assetUrl("art/production-85fee95df5693b1a.webp"),
    "all_damage": assetUrl("art/all-damage-27068e568d563870.webp"),
    "all_as": assetUrl("art/all-as-cc4c765057396f4d.webp"),
    "all_hp": assetUrl("art/all-hp-cb9744efc262efef.webp"),
    "all_move": assetUrl("art/all-move-4090d0485b10336a.webp"),
    "building_hp": assetUrl("art/building-hp-7ef513b0bbd137ab.webp"),
    "inf_dmg": assetUrl("art/inf-dmg-70fbf5f0c40c600d.webp"),
    "mag_dmg": assetUrl("art/mag-dmg-cf8ab9a80b30637b.webp"),
    "inf_hp": assetUrl("art/inf-hp-4563247e8167d15b.webp"),
    "mag_hp": assetUrl("art/mag-hp-82ba923693d0e50a.webp"),
    "chain_spawn": assetUrl("art/chain-spawn-949731eeacccbd2d.webp"),
    "siege_doctrine": assetUrl("art/siege-doctrine-458812413fffdeac.webp"),
    "melee_doctrine": assetUrl("art/melee-doctrine-7b9cebcca43811a5.webp"),
    "factory_network": assetUrl("art/factory-network-81dfbc0d697063ea.webp"),
    "double_assault": assetUrl("art/double-assault-055c6c3471d0df64.webp"),
    "no_food": assetUrl("art/no-food-a0f54391876b1b8b.webp"),
    "mobilization": assetUrl("art/mobilization-8898065ae3351e56.webp"),
    "mono_veteran": assetUrl("art/mono-veteran-8a6deaaea185affd.webp"),
    "long_training": assetUrl("art/long-training-f5e3d06999569351.webp"),
    "glass_cannon": assetUrl("art/glass-cannon-11283572ac476c24.webp"),
    "last_line": assetUrl("art/last-line-810b069028fa3628.webp"),
    "specialization": assetUrl("art/specialization-5dc01498fda4d99a.webp"),
    "full_blueprints": assetUrl("art/full-blueprints-bfd019f55c79083a.webp"),
    "wide_choice": assetUrl("art/wide-choice-2061b9ce49b92eaa.webp"),
    "double_choice": assetUrl("art/double-choice-4da2011961e52d92.webp"),
    "full_garrison_economy": assetUrl("art/full-garrison-economy-6d4e4db2c15a6e6e.webp"),
    "large_garrison": assetUrl("art/large-garrison-641e56dcbb539bbb.webp"),
    "road_rush": assetUrl("art/road-rush-539a567db7a4d966.webp"),
    "overproduction": assetUrl("art/overproduction-0f31679d3ad25400.webp"),
    "instant_l3": assetUrl("art/instant-l3-b7b12099725651fc.webp")
  };
  runtime.BUILDING_IMAGE_META = {
    "keep": {
      "w": 2,
      "h": 2
    },
    "lumber": {
      "w": 1,
      "h": 1
    },
    "stonecutter": {
      "w": 1,
      "h": 1
    },
    "farm": {
      "w": 1,
      "h": 1
    },
    "warehouse": {
      "w": 2,
      "h": 1
    },
    "barracks": {
      "w": 1,
      "h": 1
    },
    "archery": {
      "w": 1,
      "h": 1
    },
    "spearhall": {
      "w": 1,
      "h": 1
    },
    "stable": {
      "w": 2,
      "h": 1
    },
    "temple": {
      "w": 2,
      "h": 1
    },
    "siegeworks": {
      "w": 2,
      "h": 2
    },
    "magetower": {
      "w": 2,
      "h": 2
    },
    "guildhouse": {
      "w": 2,
      "h": 1
    },
    "market": {
      "w": 2,
      "h": 2
    },
    "builders": {
      "w": 2,
      "h": 1
    },
    "townhall": {
      "w": 2,
      "h": 2
    },
    "rally": {
      "w": 2,
      "h": 2
    },
    "tavern": {
      "w": 1,
      "h": 1
    },
    "guardhouse": {
      "w": 1,
      "h": 1
    }
  };
}
