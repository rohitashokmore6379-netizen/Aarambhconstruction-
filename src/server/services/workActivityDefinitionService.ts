import { WorkActivityDefinition, IWorkActivityDefinition } from '../models/workActivityDefinition.ts';

export const DEFAULT_ACTIVITY_TEMPLATES: Array<{
  name: string;
  order: number;
  category: 'PRE_CONSTRUCTION' | 'SUBSTRUCTURE' | 'SUPERSTRUCTURE' | 'MEP_SERVICES' | 'FINISHING' | 'EXTERNAL_WORKS';
  definition: string;
  completionCriteria: string[];
  unit: string;
  standardDurationDays: number;
  typicalTrades: string[];
  safetyPrecautions: string[];
  inspectionRequired: boolean;
}> = [
  {
    order: 1,
    name: 'Site Layout, Demarcation & Soil Testing',
    category: 'PRE_CONSTRUCTION',
    definition:
      'Setting out centerline offsets, benchmarks, column grid markers, and establishing ground water table & bearing capacity levels as per approved structural drawings.',
    completionCriteria: [
      'Site boundaries verified against municipal sanction plans',
      'Grid benchmarks cemented and protected from disturbance',
      'Centerline diagonals cross-verified (tolerance within ±3mm)',
      'Soil bearing capacity (SBC) report approved by structural engineer',
    ],
    unit: 'Lump Sum',
    standardDurationDays: 4,
    typicalTrades: ['Surveyor', 'Mistri', 'Helper'],
    safetyPrecautions: ['High-visibility vests', 'Safety helmet', 'Perimeter caution barricading'],
    inspectionRequired: true,
  },
  {
    order: 2,
    name: 'Foundation Excavation & Earthwork',
    category: 'SUBSTRUCTURE',
    definition:
      'Excavation for isolated, combined, or raft footings up to hard strata or engineer-specified depth, along with disposal or stacking of usable excavated soil.',
    completionCriteria: [
      'Excavation depth reached hard strata as specified in structural design',
      'Pit dimensions verified with minimum 300mm working clearance around footing',
      'Trench bottoms leveled, rammed, and cleared of loose mud/slurry',
      'Adequate shoring installed for depths exceeding 1.5 meters',
    ],
    unit: 'Cu.m',
    standardDurationDays: 6,
    typicalTrades: ['JCB / Excavator Operator', 'Helper', 'Mistri'],
    safetyPrecautions: ['Trench shoring to prevent cave-in', 'De-watering pump ready on site', 'Safety shoes & gloves'],
    inspectionRequired: true,
  },
  {
    order: 3,
    name: 'Anti-Termite Treatment & PCC Bedding',
    category: 'SUBSTRUCTURE',
    definition:
      'Chemical emulsion soil treatment followed by Plain Cement Concrete (1:4:8 or 1:3:6) bed casting to provide a solid, non-porous leveled base for reinforced concrete footings.',
    completionCriteria: [
      'Termiticide emulsion uniformly sprayed as per IS 6313',
      'PCC thickness minimum 100mm uniform across entire base',
      'PCC surface leveled, tamped, and cured with water spray for at least 48 hours',
      'Grid centerline re-marked clearly on hardened PCC surface',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 3,
    typicalTrades: ['Mason', 'Helper', 'Pest Specialist'],
    safetyPrecautions: ['Chemical respirator mask for pest treatment', 'Rubber boots for concrete pour'],
    inspectionRequired: true,
  },
  {
    order: 4,
    name: 'Footing Reinforcement & Concreting',
    category: 'SUBSTRUCTURE',
    definition:
      'Binding Fe-500/550D TMT reinforcement rebar mat as per bar bending schedule (BBS), shuttering, and pouring M20/M25 design-mix concrete with vibrator compaction.',
    completionCriteria: [
      'Rebar spacing, lap lengths, and 50mm cover block placements approved',
      'Column starter bars vertically plumbed and securely tied',
      'Concrete slump checked (75-100mm)',
      'Cube test samples taken (6 cubes minimum)',
      'No honeycombing upon shuttering removal',
    ],
    unit: 'Cu.m',
    standardDurationDays: 7,
    typicalTrades: ['Bar Bender', 'Mason', 'Helper'],
    safetyPrecautions: ['Vibrator ear protection', 'Full PPE', 'Rebar cap protectors on upright steel'],
    inspectionRequired: true,
  },
  {
    order: 5,
    name: 'Plinth Beams & Damp Proof Course (DPC)',
    category: 'SUBSTRUCTURE',
    definition:
      'Shuttering, rebar binding, casting of connecting plinth tie beams, and application of a 50mm polymer-modified waterproof DPC layer with bitumen coat.',
    completionCriteria: [
      'Plinth top elevation aligned with road/drain datum levels',
      'Beam reinforcement clear cover of 25mm maintained with factory cover blocks',
      'DPC layer installed continuously with bitumen coating on dried concrete',
      'Plumbing sleeve penetrations cast in place before concrete pour',
    ],
    unit: 'Rft',
    standardDurationDays: 8,
    typicalTrades: ['Bar Bender', 'Carpenter', 'Mason', 'Helper'],
    safetyPrecautions: ['Bitumen heating ventilation', 'Fall protection around open plinth edge'],
    inspectionRequired: true,
  },
  {
    order: 6,
    name: 'Earth Backfilling & Compaction',
    category: 'SUBSTRUCTURE',
    definition:
      'Refilling the plinth core with approved selected earth/murrum in layers not exceeding 150-200mm, with systematic water flooding and mechanical roller/plate compaction.',
    completionCriteria: [
      'Backfill free of organic debris, boulders, and construction rubbish',
      'Layer-by-layer compaction verified with plate compactor',
      'Water flooding soaked and settled for minimum 48 hours',
      'Finished level prepared for ground flooring PCC bed',
    ],
    unit: 'Cu.m',
    standardDurationDays: 5,
    typicalTrades: ['Tractor / Roller Operator', 'Helper'],
    safetyPrecautions: ['Dust masks during dry murrum dumping', 'Caution around retaining masonry'],
    inspectionRequired: false,
  },
  {
    order: 7,
    name: 'RCC Column Shuttering & Casting',
    category: 'SUPERSTRUCTURE',
    definition:
      'Vertical column rebar tying with stirrups/ties, fixing steel or ply formwork with adjustable acrow props, pouring concrete with needle vibrator, and plumb inspection.',
    completionCriteria: [
      'Column vertical alignment checked using plumb bob from both orthogonal faces',
      'Formwork rigid with zero slurry leakage during vibration',
      'Cover blocks (40mm) secured every 1 meter along column height',
      'Hessian cloth/gunny bags wrapped and kept continuously wet for 14 days',
    ],
    unit: 'Nos',
    standardDurationDays: 8,
    typicalTrades: ['Carpenter / Shuttering', 'Bar Bender', 'Mason', 'Helper'],
    safetyPrecautions: ['Scaffolding tie-back stability', 'Safety harness above 2 meters height'],
    inspectionRequired: true,
  },
  {
    order: 8,
    name: 'Brickwork & AAC Block Masonry',
    category: 'SUPERSTRUCTURE',
    definition:
      'Erecting peripheral and internal partition walls using fly ash bricks, red clay bricks, or AAC blocks with 1:4/1:6 cement mortar or block adhesive jointing.',
    completionCriteria: [
      'Bricks thoroughly saturated with water before laying (for clay bricks)',
      'Joint thickness uniform within 10mm to 12mm',
      'Wall verticality and horizontal bed courses checked every 3 courses with line dori and spirit level',
      'Toothing and shear ties anchored into RCC columns',
      'Proper 7-day water curing completed',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 14,
    typicalTrades: ['Mistri (Head Mason)', 'Bricklayer', 'Helper'],
    safetyPrecautions: ['Stable steel scaffolding stages', 'Overhead brick hauling precautions'],
    inspectionRequired: true,
  },
  {
    order: 9,
    name: 'Door/Window Lintel Beams & Chajjas',
    category: 'SUPERSTRUCTURE',
    definition:
      'Casting reinforced lintel bands over all wall openings with minimum 150mm bearing and integrated sunshade/chajja projections with drip mould details.',
    completionCriteria: [
      'Minimum 150mm bearing provided on both sides of jambs',
      'Chajja slope provided away from building facade with underside drip-groove (vata)',
      'Rebar cover and lintel thickness conforming to structural drawings',
    ],
    unit: 'Rft',
    standardDurationDays: 5,
    typicalTrades: ['Carpenter', 'Bar Bender', 'Mason'],
    safetyPrecautions: ['Cantilever formwork safety props', 'Harness for external facade work'],
    inspectionRequired: true,
  },
  {
    order: 10,
    name: 'Slab Shuttering & Reinforcement Binding',
    category: 'SUPERSTRUCTURE',
    definition:
      'Erecting cup-lock scaffolding staging, centering ply sheets, laying beam cages and bottom/top slab rebar with chairs, and laying electrical fan box conduits.',
    completionCriteria: [
      'Scaffolding props supported on solid base without settlement risk',
      'Shuttering tape applied to all sheet joints to prevent cement slurry loss',
      'Bottom cover (20mm) and top crank bars supported on steel chairs',
      'Electrical conduits, fan hooks, and plumbing cutouts verified and secured',
      'Formal structural consultant pre-pour clearance signed',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 10,
    typicalTrades: ['Carpenter', 'Bar Bender', 'Electrician', 'Mistri'],
    safetyPrecautions: ['Perimeter safety netting', 'Prohibition of unauthorized weight on rebar chairs'],
    inspectionRequired: true,
  },
  {
    order: 11,
    name: 'RCC Slab Concreting & Curing',
    category: 'SUPERSTRUCTURE',
    definition:
      'Monolithic pour of beam and roof slab with RMC or site-batch concrete, surface screed leveling, bull floating, ponding bund construction, and 21-day pond curing.',
    completionCriteria: [
      'Continuous pour without cold joints; slurry vibrated uniformly',
      'Finished slab surface leveled to slope for rainwater drainage',
      'Cement mortar curing ponds created across entire slab within 24 hours',
      'Water ponding maintained continuously for minimum 14 to 21 days',
      '28-day cube strength tested and documented',
    ],
    unit: 'Cu.m',
    standardDurationDays: 16,
    typicalTrades: ['Mason', 'Vibrator Operator', 'Helper', 'Foreman'],
    safetyPrecautions: ['Pump pipeline safety clamping', 'Overhead power cable clearance check'],
    inspectionRequired: true,
  },
  {
    order: 12,
    name: 'Internal & External Wall Plastering',
    category: 'FINISHING',
    definition:
      'Raking mortar joints, hacking RCC concrete surfaces, fixing chicken mesh across masonry-concrete junctions, and applying two coats of cement plaster (12-15mm internal, 20mm external sand-faced).',
    completionCriteria: [
      'RCC surfaces hacked with 40-50 pits per square foot',
      'Chicken wire mesh fixed over all column-beam-brick interfaces with concrete nails',
      'Button marks / plum targets made before plastering to ensure plumb accuracy',
      'Grooves and reveal lines straight and crisp',
      'Cured with water 3 times daily for minimum 7 days',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 15,
    typicalTrades: ['Plasterer / Mistri', 'Helper'],
    safetyPrecautions: ['Eye goggles against mortar splash', 'Double-stage external scaffolding'],
    inspectionRequired: true,
  },
  {
    order: 13,
    name: 'Concealed Electrical Wiring & DB Dressing',
    category: 'MEP_SERVICES',
    definition:
      'Chasing wall chases, embedding PVC conduits, pulling FRLS copper wires, earthing installation, and dressing the main distribution board (MCBs & RCCB).',
    completionCriteria: [
      'Conduits embedded flush and secured with metal saddles every 600mm',
      'Insulation resistance and continuity tests passed on all circuits',
      'Earth pit resistance verified under 2 ohms with chemical earth electrode',
      'Circuit labels matched inside Distribution Board (DB)',
    ],
    unit: 'Points',
    standardDurationDays: 8,
    typicalTrades: ['Licensed Electrician', 'Helper'],
    safetyPrecautions: ['Lock-out tag-out protocols', 'Rubber insulated tools'],
    inspectionRequired: true,
  },
  {
    order: 14,
    name: 'Plumbing Lines, Drainage & Sanitary Fitting',
    category: 'MEP_SERVICES',
    definition:
      'Installing hot/cold CPVC/UPVC water supply piping, SWR soil and waste lines, gully traps, inspection chambers, and fixing sanitary ware fixtures.',
    completionCriteria: [
      'Pressure testing of all concealed water supply lines at 10 bar for 24 hours with zero drop',
      'Gravity drainage slope verified (minimum 1:50 gradient)',
      'Gully traps and cleanouts accessible with airtight manhole covers',
      'No leakages detected on CP fittings and sanitary traps',
    ],
    unit: 'Points',
    standardDurationDays: 10,
    typicalTrades: ['Plumber', 'Helper'],
    safetyPrecautions: ['Solvent cement ventilation', 'Torch flame caution during PPR welding'],
    inspectionRequired: true,
  },
  {
    order: 15,
    name: 'Waterproofing of Wet Areas & Terraces',
    category: 'FINISHING',
    definition:
      'Surface cleaning, polymer-modified cementitious coating or brick-bat coba on sunken slabs, bathroom floors, and roof terrace with corner fillets and water pond testing.',
    completionCriteria: [
      'Coving/fillet (vata) constructed at all 90-degree wall-to-floor junctions',
      'Minimum two coats of approved elastomeric or cementitious waterproof membrane applied',
      'Pond test conducted by filling 75mm water depth for continuous 72 hours without dampness on ceiling below',
      'Ponding clearance certificate signed before tile screed',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 7,
    typicalTrades: ['Waterproofing Specialist', 'Mason', 'Helper'],
    safetyPrecautions: ['Adequate ventilation in enclosed sunken areas', 'Non-slip footwear'],
    inspectionRequired: true,
  },
  {
    order: 16,
    name: 'Vitrified Tile & Granite Flooring',
    category: 'FINISHING',
    definition:
      'Laying floor tiles, skirting, kitchen granite counter platform, and staircase treads with adhesive/cement mortar and epoxy tile grouting.',
    completionCriteria: [
      'Sub-base cleaned and dampened before mortar screed',
      'Tiles laid with uniform spacer joints without hollow sound (tap test check)',
      'Floor gradient correctly directed toward bathroom and balcony drains',
      'Kitchen granite platform polished with sink cutout and back splash skirting',
      'Epoxy grout filled flush with no pinholes',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 12,
    typicalTrades: ['Tile Mason', 'Stone Polisher', 'Helper'],
    safetyPrecautions: ['Tile cutter water shield to prevent silicosis dust', 'Gloves for epoxy handling'],
    inspectionRequired: true,
  },
  {
    order: 17,
    name: 'Doors, Windows & UPVC/Aluminum Framing',
    category: 'FINISHING',
    definition:
      'Fixing granite/wood window sills, UPVC or anodized aluminum sliding window tracks, flush door shutters, safety grills, and architectural hardware locks.',
    completionCriteria: [
      'Window frames anchored with fastener screws and sealed with weather silicone',
      'Sash sliding smoothness and lock catch engagement verified',
      'Door shutters square with uniform 3mm clearance all around',
      'Door closures, stoppers, and mortise locks function smoothly',
    ],
    unit: 'Nos',
    standardDurationDays: 8,
    typicalTrades: ['Fabricator', 'Carpenter', 'Glazier'],
    safetyPrecautions: ['Glass handling suction grips', 'Grinding spark protection'],
    inspectionRequired: false,
  },
  {
    order: 18,
    name: 'Interior & Exterior Painting & Finishing',
    category: 'FINISHING',
    definition:
      'Surface rubbing, application of 1 coat primer, 2 coats of acrylic wall putty, fine sanding, followed by 2 coats of premium interior emulsion & exterior weather-proof coating.',
    completionCriteria: [
      'Wall surfaces smooth, uniform, free of undulations under halogen light check',
      'Exterior surfaces primed with anti-fungal primer and sealed against rainwater',
      'Color tone, sheen, and texture matches approved client shade card',
      'Switch plates, floors, and glasses masked and protected from paint splatter',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 14,
    typicalTrades: ['Painter', 'Putty Applicator', 'Helper'],
    safetyPrecautions: ['Respirator dust masks for dry sanding', 'Scaffold safety belts for exterior facades'],
    inspectionRequired: true,
  },
  {
    order: 19,
    name: 'Site Clearance, Testing & External Paving',
    category: 'EXTERNAL_WORKS',
    definition:
      'Laying interlock paver blocks on driveway, compound wall finishing, storm water drainage channel connections, and removal of all construction debris.',
    completionCriteria: [
      'All scaffolding dismantled and transported off site',
      'Driveway paving slopes toward rainwater harvesting pit or municipal drain',
      'Compound gate hinged and swings smoothly with security latch',
      'External yard cleared of surplus soil and rubble',
    ],
    unit: 'Sq.ft',
    standardDurationDays: 6,
    typicalTrades: ['Paver Mason', 'Helper', 'Truck Driver'],
    safetyPrecautions: ['Traffic cautionary signage outside site entrance', 'Heavy equipment supervision'],
    inspectionRequired: false,
  },
  {
    order: 20,
    name: 'Final Snagging, Quality Audit & Handover',
    category: 'EXTERNAL_WORKS',
    definition:
      'Joint comprehensive site walk-through with client/architect, resolving any minor defect list (snags), verifying all utility meters, and issuing the Handover Dossier.',
    completionCriteria: [
      '100% snag list rectification items verified and signed off',
      'Deep cleaning of all rooms, glass panes, and toilets completed',
      'All electrical, plumbing, and drainage systems live-tested in client presence',
      'As-built drawings, warranty cards, and key sets handed over to owner',
    ],
    unit: 'Lump Sum',
    standardDurationDays: 4,
    typicalTrades: ['Project Engineer', 'Quality Inspector', 'Deep Cleaner'],
    safetyPrecautions: ['Final electrical load check', 'Fire extinguisher readiness check'],
    inspectionRequired: true,
  },
];

export class WorkActivityDefinitionService {
  /**
   * Retrieves activity definitions with optional filters
   */
  static async getAllDefinitions(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<IWorkActivityDefinition[]> {
    const query: any = {};

    if (filters?.status && filters.status !== 'ALL') {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'ARCHIVED' };
    }

    if (filters?.category && filters.category !== 'ALL') {
      query.category = filters.category;
    }

    if (filters?.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { definition: searchRegex }, { completionCriteria: searchRegex }];
    }

    let definitions = await WorkActivityDefinition.find(query).sort({ order: 1, createdAt: 1 });

    // If no templates exist in the database, automatically seed default standard templates
    if (definitions.length === 0 && (!filters?.search || !filters.search.trim())) {
      await this.seedDefaultDefinitions();
      definitions = await WorkActivityDefinition.find(query).sort({ order: 1, createdAt: 1 });
    }

    return definitions;
  }

  /**
   * Get single activity definition by ID
   */
  static async getDefinitionById(id: string): Promise<IWorkActivityDefinition | null> {
    return WorkActivityDefinition.findById(id);
  }

  /**
   * Create a new activity definition
   */
  static async createDefinition(
    data: Partial<IWorkActivityDefinition>,
    userId?: string
  ): Promise<IWorkActivityDefinition> {
    // If order is not specified, calculate next order index
    if (data.order === undefined || data.order === null) {
      const highest = await WorkActivityDefinition.findOne().sort({ order: -1 }).select('order');
      data.order = highest ? highest.order + 1 : 1;
    }

    // Clean up arrays if submitted as strings or comma-separated
    let criteria: string[] = [];
    if (Array.isArray(data.completionCriteria)) {
      criteria = data.completionCriteria.map((c) => String(c).trim()).filter(Boolean);
    } else if (typeof data.completionCriteria === 'string') {
      criteria = (data.completionCriteria as string)
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    let trades: string[] = [];
    if (Array.isArray(data.typicalTrades)) {
      trades = data.typicalTrades.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof data.typicalTrades === 'string') {
      trades = (data.typicalTrades as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    let safety: string[] = [];
    if (Array.isArray(data.safetyPrecautions)) {
      safety = data.safetyPrecautions.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof data.safetyPrecautions === 'string') {
      safety = (data.safetyPrecautions as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return WorkActivityDefinition.create({
      name: String(data.name || '').trim(),
      order: Number(data.order) || 1,
      category: data.category || 'SUPERSTRUCTURE',
      definition: String(data.definition || '').trim(),
      completionCriteria: criteria,
      unit: data.unit || 'Sq.ft',
      standardDurationDays: Number(data.standardDurationDays) || 7,
      typicalTrades: trades,
      safetyPrecautions: safety,
      inspectionRequired: data.inspectionRequired !== undefined ? Boolean(data.inspectionRequired) : true,
      isDefaultTemplate: data.isDefaultTemplate !== undefined ? Boolean(data.isDefaultTemplate) : false,
      status: data.status || 'ACTIVE',
      createdBy: userId as any,
    });
  }

  /**
   * Update an existing activity definition
   */
  static async updateDefinition(
    id: string,
    data: Partial<IWorkActivityDefinition>
  ): Promise<IWorkActivityDefinition | null> {
    const existing = await WorkActivityDefinition.findById(id);
    if (!existing) return null;

    if (data.name !== undefined) existing.name = String(data.name).trim();
    if (data.order !== undefined) existing.order = Number(data.order);
    if (data.category !== undefined) existing.category = data.category;
    if (data.definition !== undefined) existing.definition = String(data.definition).trim();
    if (data.unit !== undefined) existing.unit = String(data.unit).trim();
    if (data.standardDurationDays !== undefined) existing.standardDurationDays = Number(data.standardDurationDays);
    if (data.inspectionRequired !== undefined) existing.inspectionRequired = Boolean(data.inspectionRequired);
    if (data.status !== undefined) existing.status = data.status;

    if (data.completionCriteria !== undefined) {
      if (Array.isArray(data.completionCriteria)) {
        existing.completionCriteria = data.completionCriteria.map((c) => String(c).trim()).filter(Boolean);
      } else if (typeof data.completionCriteria === 'string') {
        existing.completionCriteria = (data.completionCriteria as string)
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean);
      }
    }

    if (data.typicalTrades !== undefined) {
      if (Array.isArray(data.typicalTrades)) {
        existing.typicalTrades = data.typicalTrades.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof data.typicalTrades === 'string') {
        existing.typicalTrades = (data.typicalTrades as string)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    if (data.safetyPrecautions !== undefined) {
      if (Array.isArray(data.safetyPrecautions)) {
        existing.safetyPrecautions = data.safetyPrecautions.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof data.safetyPrecautions === 'string') {
        existing.safetyPrecautions = (data.safetyPrecautions as string)
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    await existing.save();
    return existing;
  }

  /**
   * Delete or archive an activity definition
   */
  static async deleteDefinition(id: string, hardDelete: boolean = false): Promise<boolean> {
    if (hardDelete) {
      const res = await WorkActivityDefinition.findByIdAndDelete(id);
      return Boolean(res);
    }

    const existing = await WorkActivityDefinition.findById(id);
    if (!existing) return false;
    existing.status = 'ARCHIVED';
    await existing.save();
    return true;
  }

  /**
   * Reorder activity definitions based on an array of IDs
   */
  static async reorderDefinitions(orderedIds: string[]): Promise<void> {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await WorkActivityDefinition.bulkWrite(bulkOps);
    }
  }

  /**
   * Seeds default standard CPWD construction task templates
   */
  static async seedDefaultDefinitions(force: boolean = false): Promise<{ count: number }> {
    if (force) {
      await WorkActivityDefinition.deleteMany({});
    } else {
      const count = await WorkActivityDefinition.countDocuments();
      if (count > 0) {
        return { count };
      }
    }

    const created = await WorkActivityDefinition.insertMany(
      DEFAULT_ACTIVITY_TEMPLATES.map((tmpl) => ({
        ...tmpl,
        isDefaultTemplate: true,
        status: 'ACTIVE',
      }))
    );

    return { count: created.length };
  }
}
