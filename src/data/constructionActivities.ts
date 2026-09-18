export interface ConstructionActivityDefinition {
  name: string;
  order: number;
  shortDefinition: string;
  description: string;
  completionCriteria: string[];
  suggestedProgressStages: { progress: number; label: string }[];
  defaultUnit: string;
  prerequisites: string[];
  suggestedImageTypes: ('BEFORE' | 'DURING' | 'COMPLETED')[];
}

export const DEFAULT_CONSTRUCTION_ACTIVITIES: ConstructionActivityDefinition[] = [
  {
    order: 1,
    name: 'Site Lineout',
    shortDefinition: 'Marking the building layout on the actual site according to approved plan, setbacks, grid lines and benchmark levels.',
    description: 'Marking the building layout on the actual site according to the approved plan, dimensions, setbacks, grid lines, and reference points.',
    completionCriteria: [
      'Layout marked on site accurately with lime/strings',
      'Major diagonal and offset dimensions verified against CAD drawing',
      'Reference bench mark and grid pillars established',
      'Admin confirmation of site boundary clearances'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Initial boundary marking' },
      { progress: 50, label: 'Grid line setup' },
      { progress: 75, label: 'Diagonal & setback verification' },
      { progress: 100, label: 'Lineout completed & approved' }
    ],
    defaultUnit: 'R.ft',
    prerequisites: [],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 2,
    name: 'Excavation of Column Pit',
    shortDefinition: 'Excavating individual pits at designated column locations according to approved structural dimensions and depth.',
    description: 'Excavating individual pits at the designated column locations according to the approved structural dimensions and required depth.',
    completionCriteria: [
      'Required pits excavated to specified hard strata depth',
      'Pit dimensions and verticality checked',
      'Excavated soil safely stacked/disposed'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Pits lineout & initial digging' },
      { progress: 50, label: '50% column pits excavated' },
      { progress: 75, label: 'Final depth reached in all pits' },
      { progress: 100, label: 'Pit dressing & bottom leveling done' }
    ],
    defaultUnit: 'Cu.m',
    prerequisites: ['Site Lineout'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 3,
    name: 'Footing',
    shortDefinition: 'Construction of reinforced column footings to safely transfer structural loads to supporting soil.',
    description: 'Construction of column footings that transfer structural loads safely from columns to the supporting soil.',
    completionCriteria: [
      'Steel mat reinforcement tied as per bar bending schedule',
      'Cover blocks placed properly',
      'Shuttering installed and checked',
      'M20/M25 concrete casting with needle vibrator'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Steel mesh fabrication & placement' },
      { progress: 50, label: 'Footing shuttering & cover check' },
      { progress: 75, label: 'Concrete pouring & compaction' },
      { progress: 100, label: 'Footing casting done & curing started' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Excavation of Column Pit'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 4,
    name: 'Column Neck',
    shortDefinition: 'Casting column stubs rising from footing up to plinth beam bottom level.',
    description: 'Construction of the column portion rising from the footing to the required level, including reinforcement and concrete work as applicable.',
    completionCriteria: [
      'Column neck reinforcement aligned with main axis',
      'Vertical plumb and centering checked',
      'Concrete poured up to plinth bottom level',
      'Curing done for 7 days minimum'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Column ties & stirrups fabrication' },
      { progress: 50, label: 'Formwork shuttering & plumb check' },
      { progress: 75, label: 'Concrete casting & de-shuttering' },
      { progress: 100, label: 'Column neck cured & ready for plinth' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Footing'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 5,
    name: 'Excavation of Foundation',
    shortDefinition: 'Excavation of foundation trenches or load-bearing areas for peripheral and partition walls.',
    description: 'Excavation of the foundation trenches or areas required for the building foundation according to the approved layout and required dimensions.',
    completionCriteria: [
      'Trench width and depth achieved as per soil bearing design',
      'Trench bed leveled and rammed',
      'Site cleared for masonry/PCC bed'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Trench marking on ground' },
      { progress: 50, label: 'Excavation in progress' },
      { progress: 75, label: 'Bed cleaning & depth verification' },
      { progress: 100, label: 'Excavation completed and approved' }
    ],
    defaultUnit: 'Cu.m',
    prerequisites: ['Site Lineout'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 6,
    name: 'Foundation Work',
    shortDefinition: 'Construction of building foundation system (UCR stone masonry or RCC foundation) over prepared excavation.',
    description: 'Construction of the building foundation system over the prepared excavation according to the structural design and site requirements.',
    completionCriteria: [
      'UCR / Brick foundation masonry constructed in 1:6 cement mortar',
      'Bond stones and through stones provided at intervals',
      'Top surface leveled for plinth beam integration'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Foundation bedding layer' },
      { progress: 50, label: 'Masonry courses up to ground level' },
      { progress: 75, label: 'Through stone packing & raking' },
      { progress: 100, label: 'Foundation work completed' }
    ],
    defaultUnit: 'Cu.m',
    prerequisites: ['Excavation of Foundation'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 7,
    name: 'Plinth Beam',
    shortDefinition: 'Reinforced concrete beam cast around building perimeter to tie columns and support ground walls.',
    description: 'Construction of the plinth beam at the specified building level to connect structural elements and provide the required support at plinth level.',
    completionCriteria: [
      'Beam reinforcement steel tied with stirrups & lap lengths checked',
      'Side formwork aligned in straight line and level',
      'DPC / concrete poured with continuous vibration',
      'Minimum 7 days water curing'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Steel tying & spacing of rings' },
      { progress: 50, label: 'Side shuttering & cover blocks' },
      { progress: 75, label: 'Concreting with M20 grade' },
      { progress: 100, label: 'Plinth beam cast, de-shuttered & cured' }
    ],
    defaultUnit: 'R.ft',
    prerequisites: ['Column Neck', 'Foundation Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 8,
    name: 'Murrum Filling',
    shortDefinition: 'Filling within the plinth beam zone with selected quarry murrum in controlled 200mm layers.',
    description: 'Filling selected areas within the plinth/floor zone with approved murrum or suitable filling material in controlled layers.',
    completionCriteria: [
      'Debris and organic matter removed prior to filling',
      'Murrum dumped and spread in uniform layers',
      'Water ponding done for natural consolidation'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Quarry murrum unloading at site' },
      { progress: 50, label: 'First layer spreading & watering' },
      { progress: 75, label: 'Final layer filling up to PCC level' },
      { progress: 100, label: 'Murrum filling finished to required height' }
    ],
    defaultUnit: 'Cu.m',
    prerequisites: ['Plinth Beam'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 9,
    name: 'Compaction',
    shortDefinition: 'Mechanical or manual plate compaction of murrum filling to eliminate air voids and settlement.',
    description: 'Compacting the filled material to achieve the required density and stable base for subsequent construction work.',
    completionCriteria: [
      'Plate compactor / roller passed minimum 3-4 times across floor',
      'No loose pockets or hollow sounds upon impact',
      'Final top sub-base level verified with water tube'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Ponding & soil moisture readiness' },
      { progress: 50, label: 'Plate compactor run - stage 1' },
      { progress: 75, label: 'Final compacting & leveling' },
      { progress: 100, label: 'Sub-base fully hardened & tested' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Murrum Filling'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 10,
    name: 'PCC Work',
    shortDefinition: 'Pouring Plain Cement Concrete (M10/M15) as solid under-bedding for flooring and brick masonry.',
    description: 'Providing Plain Cement Concrete as the specified base/preparatory layer for subsequent construction work.',
    completionCriteria: [
      'Specified 1:3:6 or 1:4:8 concrete mix placed to uniform 4 inch thickness',
      'Surface leveled with wooden screed / float',
      'Curing done for 5 days'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Level pegs marking across floor' },
      { progress: 50, label: 'Concrete mixing & spreading' },
      { progress: 75, label: 'Tamping & surface finish' },
      { progress: 100, label: 'PCC cured & ready for masonry' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Compaction'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 11,
    name: 'Column Casting',
    shortDefinition: 'RCC column shuttering, vertical plumb alignment, and concrete casting from plinth to beam bottom.',
    description: 'Casting structural columns according to the approved structural design, including reinforcement, formwork, concrete placement, and related checks.',
    completionCriteria: [
      'Reinforcement lapping & cover checked',
      'Column box shuttering plumbed with plumb bob in two directions',
      'Concrete poured and compacted with needle vibrator without honeycomb',
      'Hessian cloth wrapping & water curing maintained'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Steel rebar tying & lateral ties' },
      { progress: 50, label: 'Shuttering boxes fixed & plumb checked' },
      { progress: 75, label: 'Concrete casting & vibration' },
      { progress: 100, label: 'Boxes stripped, hacking done & cured' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Plinth Beam'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 12,
    name: 'Brick Masonry',
    shortDefinition: 'Constructing superstructure external 9" and internal 4" walls with red clay or flyash bricks.',
    description: 'Construction of walls using approved masonry units according to the building layout, wall thickness, openings, and required alignment.',
    completionCriteria: [
      'Brick soaked in water prior to laying',
      'True horizontal courses with plumb line and straight edge',
      'Door/window rough openings left with accurate dimensions',
      'Raking of joints for plaster grip done fresh'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Sill level masonry reached' },
      { progress: 50, label: 'Lintel level masonry reached' },
      { progress: 75, label: 'Slab bottom level reached' },
      { progress: 100, label: 'All wall masonry completed & cured' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Column Casting', 'PCC Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 13,
    name: 'Lintel Work',
    shortDefinition: 'Reinforced concrete lintel band and chajja projections over doors, windows and openings.',
    description: 'Construction of lintels above specified door, window, and other wall openings as required by the structural/design details.',
    completionCriteria: [
      'Lintel reinforcement & bearings over wall verified',
      'Shuttering and drip mold provision on chajja sunshades',
      'Concrete poured and cured'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Lintel shuttering on openings' },
      { progress: 50, label: 'Steel reinforcement & chajja bars' },
      { progress: 75, label: 'Casting of lintel band & sunshades' },
      { progress: 100, label: 'Lintels cast & cured' }
    ],
    defaultUnit: 'R.ft',
    prerequisites: ['Brick Masonry'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 14,
    name: 'Slab Level',
    shortDefinition: 'Erecting steel props, staging, beam bottoms, and plywood centering shuttering at slab ceiling level.',
    description: 'Preparation and verification of the slab level, including required levels, shuttering/formwork, and layout before slab casting.',
    completionCriteria: [
      'Heavy duty steel jacks and props securely braced',
      'Centering sheet joints sealed with tape to avoid slurry leakage',
      'Beam depths and cambers verified with water level tube'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Centering props & staging erect' },
      { progress: 50, label: 'Beam bottoms & sides fixed' },
      { progress: 75, label: 'Slab ply sheeting laid & leveled' },
      { progress: 100, label: 'Centering inspected & ready for steel' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Brick Masonry', 'Lintel Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 15,
    name: 'Slab Casting',
    shortDefinition: 'Fixing slab & beam reinforcement, conduit placement, casting concrete and continuous curing.',
    description: 'Casting the structural slab according to the approved design and construction requirements.',
    completionCriteria: [
      'Top and bottom steel mesh tied with cover blocks & chairs',
      'Electrical conduits, fan hooks, and plumbing sleeves placed',
      'Ready Mix / Batching concrete placed, vibrated, and float-finished',
      'Water ponding bunds made for 14-21 days curing'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Beam & slab rebar binding' },
      { progress: 50, label: 'Electrical piping & final clearance' },
      { progress: 75, label: 'RCC slab concrete pouring' },
      { progress: 100, label: 'Slab casting finished & ponding curing on' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Slab Level'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 16,
    name: 'Electric Work',
    shortDefinition: 'Wall chasing, fixing concealed metal/PVC switch boxes, and laying PVC conduits.',
    description: 'Electrical installation activities associated with conduits, boxes, points, routes, and other electrical provisions during the appropriate construction stage.',
    completionCriteria: [
      'Wall grooves cut with cutter machine to avoid wall damage',
      'Conduit pipes secured with clamps & wire',
      'Modular junction boxes plumbed flush with plaster line'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Chasing lines marked on walls' },
      { progress: 50, label: 'Groove cutting & conduit piping' },
      { progress: 75, label: 'Switch boxes installation' },
      { progress: 100, label: 'Conduit inspection completed' }
    ],
    defaultUnit: 'Point',
    prerequisites: ['Slab Casting', 'Brick Masonry'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 17,
    name: 'Window Grill',
    shortDefinition: 'Fabrication and welding of MS decorative safety grills and holdfast anchoring into window jambs.',
    description: 'Fabrication/installation of window grills or required protective metalwork at designated window openings.',
    completionCriteria: [
      'Grills fabricated as per approved architectural pattern',
      'Holdfasts embedded in cement mortar grouting',
      'Red oxide primer coat applied to prevent rust'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Workshop grill fabrication' },
      { progress: 50, label: 'Window opening sizing & fitting' },
      { progress: 75, label: 'Welding & holdfast grouting' },
      { progress: 100, label: 'Grills installed & red oxide painted' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Brick Masonry'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 18,
    name: 'Plastering Work',
    shortDefinition: 'Internal cement plaster (12-15mm smooth sponge finish) and external double-coat sand-faced plaster.',
    description: 'Application of plaster to designated internal/external wall and ceiling surfaces according to the project requirements.',
    completionCriteria: [
      'Chicken wire mesh fixed over masonry-column RCC joints',
      'Bull marks set for true vertical alignment',
      'Sponge / trowel finish completed without cracks',
      'Regular water curing for 7-10 days'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Internal ceiling & rough coat' },
      { progress: 50, label: 'Internal wall plaster completed' },
      { progress: 75, label: 'External first base coat done' },
      { progress: 100, label: 'External sand face plaster done & cured' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Electric Work', 'Window Grill'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 19,
    name: 'Plumbing Work',
    shortDefinition: 'Laying CPVC hot/cold internal lines, UPVC drainage lines, gully traps and sewage soil pipes.',
    description: 'Installation of plumbing lines, water supply, drainage, and related plumbing provisions according to the project requirements.',
    completionCriteria: [
      'Pressure testing of internal water lines conducted at 5-7 bar',
      'Adequate gradient provided on drainage lines to avoid clogging',
      'Waterproofing done around bathroom core cutting holes'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Concealed CPVC waterline piping' },
      { progress: 50, label: 'Drainage & soil waste pipe fixing' },
      { progress: 75, label: 'Hydrostatic pressure testing' },
      { progress: 100, label: 'Rough plumbing & waterproofing completed' }
    ],
    defaultUnit: 'Point',
    prerequisites: ['Plastering Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 20,
    name: 'Tile Work',
    shortDefinition: 'Laying floor vitrified tiles, bathroom wall tiles up to lintel height, kitchen platform granite and dados.',
    description: 'Installation of floor and/or wall tiles in designated areas according to the selected material, layout, and project requirements.',
    completionCriteria: [
      'Slope towards bathroom floor trap checked with water runoff',
      'Tile joints filled with matching epoxy / tile grout',
      'Hollow sound test passed on all tiled areas'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Kitchen granite platform & dado' },
      { progress: 50, label: 'Bathroom wall & floor tile laying' },
      { progress: 75, label: 'Main hall & bedroom vitrified flooring' },
      { progress: 100, label: 'Tile grouting, cleaning & skirtings done' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Plumbing Work', 'Plastering Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 21,
    name: 'Putty',
    shortDefinition: 'Applying first and second coats of polymer wall putty on dry plastered surfaces and sanding smooth.',
    description: 'Application of putty to prepared surfaces to provide a smooth surface before final painting.',
    completionCriteria: [
      'Base walls cleaned of loose plaster and efflorescence',
      'Two uniform coats of water-resistant white putty applied',
      'Surface checked under light for undulations'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Surface rubbing & dust cleaning' },
      { progress: 50, label: 'First coat white cement putty' },
      { progress: 75, label: 'Second coat putty application' },
      { progress: 100, label: 'Base putty completed' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Plastering Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 22,
    name: 'Electric Wiring',
    shortDefinition: 'Drawing FRLS copper wires through conduits, circuit loop distribution, and fixing MCB distribution boards.',
    description: 'Installation of electrical wiring and connections for the planned electrical points and circuits.',
    completionCriteria: [
      'Proper wire gauge used (1.5 sq.mm lighting, 2.5/4 sq.mm power points)',
      'Earthing wire connected to main earth pit',
      'Megger insulation resistance & continuity check passed'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Fish wire drawing & cable pulling' },
      { progress: 50, label: 'Power & light circuit wiring' },
      { progress: 75, label: 'MCB box dressing & phase balancing' },
      { progress: 100, label: 'Wiring completed & tested for shorts' }
    ],
    defaultUnit: 'Point',
    prerequisites: ['Electric Work', 'Tile Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 23,
    name: 'Door Fitting',
    shortDefinition: 'Installation of main wooden door, waterproof flush doors for bedrooms, and FRP/PVC doors for toilets.',
    description: 'Installation and fitting of doors, frames, hardware, and associated components at designated openings.',
    completionCriteria: [
      'Door frames anchored firmly with countersunk screws/fasteners',
      'Smooth swing without rubbing or binding against floor/jambs',
      'Locks, tower bolts, handles and door stoppers properly fitted'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Door frame installation & alignment' },
      { progress: 50, label: 'Door shutter sizing & hinge mortising' },
      { progress: 75, label: 'Lock & hardware fitting' },
      { progress: 100, label: 'Doors fitted & latching smoothly' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Tile Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 24,
    name: 'Sanitary Fitting',
    shortDefinition: 'Installing sanitary ware: commodes, wash basins, faucets, divertors, health faucets, and overhead showers.',
    description: 'Installation of sanitary fixtures such as toilets, wash basins, and other specified bathroom fixtures.',
    completionCriteria: [
      'All fixtures securely mounted with gaskets and silicon sealant',
      'Zero leakage observed on pressure supply and waste couplings',
      'Flush valves and faucets tested for flow and operation'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Basin & toilet mounting bolts fixing' },
      { progress: 50, label: 'Sanitary ceramic ware installation' },
      { progress: 75, label: 'CP bathroom fittings & taps assembly' },
      { progress: 100, label: 'Sanitary fixtures tested & functioning' }
    ],
    defaultUnit: 'Nos',
    prerequisites: ['Plumbing Work', 'Tile Work'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 25,
    name: 'Putty - Final Coat',
    shortDefinition: 'Final touch-up putty application, 220/320 grit paper sanding, and primer application before painting.',
    description: 'Final putty/surface preparation stage before application of the selected final paint/colour system.',
    completionCriteria: [
      'Zero visible pinholes, scratches or trowel marks',
      'Ultra smooth glass-like finish achieved on touch',
      'One coat of water-based wall primer applied and dried'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Touch up on hairline patches' },
      { progress: 50, label: 'Fine mechanical sand papering' },
      { progress: 75, label: 'Primer coat application' },
      { progress: 100, label: 'Walls primed & fully ready for colour' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Putty', 'Door Fitting'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  },
  {
    order: 26,
    name: 'Colour',
    shortDefinition: 'Two coats of premium emulsion paint on interior walls and weather-shield acrylic paint on exterior walls.',
    description: 'Final painting/colour application to the designated internal and external surfaces according to the project requirements.',
    completionCriteria: [
      'Two uniform roller coats applied without brush streaks or drips',
      'Approved shade consistency across all rooms and exterior faces',
      'Flooring protected and final site cleanup handed over'
    ],
    suggestedProgressStages: [
      { progress: 25, label: 'Ceiling white painting done' },
      { progress: 50, label: 'Internal walls 1st & 2nd coat colour' },
      { progress: 75, label: 'Exterior weather-proof paint coating' },
      { progress: 100, label: 'Final touch-up done, project handed over' }
    ],
    defaultUnit: 'Sq.ft',
    prerequisites: ['Putty - Final Coat'],
    suggestedImageTypes: ['BEFORE', 'DURING', 'COMPLETED']
  }
];
