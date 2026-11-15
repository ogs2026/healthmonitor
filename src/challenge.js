// Challenge alignment helpers for Hubble Health.
//
// NASA Space Apps Challenge 2026, "Create Health Monitoring Software for
// Astronauts on Space Missions":
// https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
//
// This file holds the parts of the app that answer the challenge's questions:
// - When might a result warrant attention?  -> LEVELS, ALERT_LIMITS, levelFor()
// - How do spaceflight hazards affect each indicator?  -> INDICATOR_CONTEXT
// - Different mission environments  -> ENVIRONMENTS
// - Which body part is affected (clickable body figure)  -> BODY_SYSTEMS
// - What actions can prevent a critical condition?  -> NEXT_STEPS
//
// Facts are taken from the challenge's listed resources (NASA Human Research
// Program and Canadian Space Agency pages, summarized in src/library.js) and
// cite them. Alert limits are demonstration values, not medical thresholds.

var NASA_HAZARDS = 'https://www.nasa.gov/hrp/hazards/';
var NASA_RISKS = 'https://www.nasa.gov/hrp/risks/';
var NASA_RESEARCH = 'https://www.nasa.gov/hrp/ongoing-hrp-research/';
var CSA_RADIATION = 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp';
var CSA_SCIENCE = 'https://asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp';

export var SOURCES = { NASA_HAZARDS: NASA_HAZARDS, NASA_RISKS: NASA_RISKS, NASA_RESEARCH: NASA_RESEARCH, CSA_RADIATION: CSA_RADIATION, CSA_SCIENCE: CSA_SCIENCE };

// ---------------------------------------------------------------------------
// Status levels. Colour is never the only cue: every level also has a word.
export var LEVELS = {
  none: { label: 'Not recorded', color: '#7F93AE', icon: 'ellipse-outline' },
  ok: { label: 'Normal', color: '#4CD08B', icon: 'checkmark-circle' },
  watch: { label: 'Check', color: '#FFC857', icon: 'alert-circle' },
  urgent: { label: 'Urgent', color: '#FF6B6B', icon: 'warning' }
};
var RANK = { none: 0, ok: 1, watch: 2, urgent: 3 };
export var worstLevel = function(levels) {
  return levels.reduce(function(worst, level) { return RANK[level] > RANK[worst] ? level : worst; }, 'none');
};

// "Urgent" limits. A reading outside the person's own range is "Check"; a
// reading past these limits is "Urgent". Demonstration values based on common
// adult limits. The crew's flight surgeon sets the real ones.
export var ALERT_LIMITS = {
  systolic: { low: 90, high: 180 },
  diastolic: { high: 120 },
  heart: { low: 40, high: 120 },
  glucose: { low: 54, high: 250 },
  temperature: { low: 35.0, high: 38.5 },
  sleep: { low: 4 }
};
export var ALERT_LIMITS_NOTE = 'Urgent limits are demonstration values (systolic under 90 or 180 and over, diastolic 120 and over, heart rate under 40 or over 120 bpm, glucose under 54 or over 250 mg/dL, temperature under 35.0 or 38.5 °C and over, sleep under 4 hours, or a very low mood). Your flight surgeon sets the limits for your mission.';

var beyond = function(value, limit) {
  if (value == null || value === '' || !limit) return false;
  var number = Number(value);
  return (limit.low != null && number < limit.low) || (limit.high != null && number >= limit.high);
};
var outsideRange = function(value, range) {
  var parts = String(range || '').split(/[–-]/).map(Number);
  return value != null && value !== '' && parts.length === 2 && isFinite(parts[0]) && isFinite(parts[1]) && (Number(value) < parts[0] || Number(value) > parts[1]);
};

export var levelFor = function(row, key, ranges) {
  if (!row) return 'none';
  if (key === 'pressure') {
    if (row.systolic_pressure == null || row.diastolic_pressure == null) return 'none';
    if (beyond(row.systolic_pressure, ALERT_LIMITS.systolic) || beyond(row.diastolic_pressure, ALERT_LIMITS.diastolic)) return 'urgent';
    return outsideRange(row.systolic_pressure, ranges.systolic) || outsideRange(row.diastolic_pressure, ranges.diastolic) ? 'watch' : 'ok';
  }
  if (key === 'mood') {
    if (!row.mood) return 'none';
    if (row.mood === 'very_low') return 'urgent';
    return row.mood === 'low' ? 'watch' : 'ok';
  }
  var field = { heart: 'heart_rate', glucose: 'blood_sugar', temperature: 'body_temperature', sleep: 'sleep_hours' }[key];
  if (!field || row[field] == null) return 'none';
  if (beyond(row[field], ALERT_LIMITS[key])) return 'urgent';
  return outsideRange(row[field], ranges[key]) ? 'watch' : 'ok';
};

// What to do at each level: actions that help prevent a critical condition.
export var NEXT_STEPS = {
  none: { title: 'Take your first reading', body: 'Follow the measurement guide, then record the result. A few days of readings build your personal baseline.' },
  ok: { title: 'Keep tracking your baseline', body: 'Your readings are inside your personal ranges. Keep the same time of day and method so changes stand out early.' },
  watch: { title: 'Rest, then recheck', body: 'Repeat the unusual measurement after resting for five minutes, using the same method. If it stays outside your range, or you have symptoms, tell your crew medical officer at the next planned contact.' },
  urgent: { title: 'Get help now', body: 'Stop strenuous work, recheck once, and contact your crew medical officer or flight surgeon right away using your mission’s procedure. On missions far from Earth, follow your onboard emergency procedure without waiting for a reply from the ground.' }
};

// ---------------------------------------------------------------------------
// Why each indicator matters in space, linked to NASA's five hazards.
export var INDICATOR_CONTEXT = {
  pressure: {
    hazards: ['Gravity fields'],
    space: 'Without gravity, body fluids shift toward the head and the heart and blood vessels adapt. Blood pressure shows how your circulation is coping, and it matters again when you return to gravity.',
    canMeasure: 'Yes, with an automatic cuff, seated and rested, at the same time each day.',
    library: 'risks', source: NASA_RISKS
  },
  heart: {
    hazards: ['Gravity fields', 'Isolation and confinement'],
    space: 'Heart rate reflects fitness, fluid shifts, stress and sleep. Fitness declines without regular exercise in weightlessness, so a rising resting heart rate is worth noticing.',
    canMeasure: 'Yes, by counting the pulse for 60 seconds at rest or with a cuff or wearable.',
    library: 'risks', source: NASA_RISKS
  },
  glucose: {
    hazards: ['Hostile and closed environments', 'Distance from Earth'],
    space: 'Food must stay nutritious and safe for long periods, and resupply is limited far from Earth. Glucose helps show how diet, activity and stress are affecting your body.',
    canMeasure: 'Yes, with a finger-stick meter. Note when you last ate.',
    library: 'risks', source: NASA_RISKS
  },
  temperature: {
    hazards: ['Hostile and closed environments'],
    space: 'Spaceflight stress can change immune responses and reawaken dormant viruses. In a closed spacecraft, a fever can affect the whole crew, so report it early.',
    canMeasure: 'Yes, with an oral thermometer, using the same method each time.',
    library: 'risks', source: NASA_RISKS
  },
  sleep: {
    hazards: ['Isolation and confinement', 'Distance from Earth'],
    space: 'Chronic sleep loss, heavy workloads and shifted body clocks add to other stresses. Short sleep often shows before people notice they are tired.',
    canMeasure: 'Yes, by noting when you fell asleep and woke, or with a wearable.',
    library: 'risks', source: NASA_RISKS
  },
  mood: {
    hazards: ['Isolation and confinement', 'Distance from Earth'],
    space: 'Small crews live in tight quarters for months, far from family. Mood, focus and teamwork can change, and noticing early lets the crew support each other.',
    canMeasure: 'Yes, as a short self-rating at the same time each day.',
    library: 'hazards', source: NASA_HAZARDS
  }
};

// ---------------------------------------------------------------------------
// Mission environments. Gravity and the effect of distance come from NASA's
// "5 Hazards of Human Spaceflight"; the deep-space challenges from the CSA's
// "Why do we conduct science experiments in space?". Signal delays are the
// light travel time for the typical distances (Moon about 384,400 km; Mars
// between about 55 and 400 million km from Earth).
export var ENVIRONMENTS = [
  {
    key: 'station', label: 'Space station', short: 'Low Earth orbit',
    gravity: 'Weightlessness', delay: 'Near real-time contact', delaySeconds: 0,
    note: 'Ground support is close: flight surgeons can review results the same day, and a crew can return to Earth within hours.',
    source: NASA_HAZARDS
  },
  {
    key: 'moon', label: 'Moon surface', short: 'Lunar mission',
    gravity: 'About one-sixth of Earth’s gravity', delay: 'About 1.3 seconds each way', delaySeconds: 1.3,
    note: 'Contact is quick, but a return to Earth takes days. The crew handles first response on its own.',
    source: NASA_HAZARDS
  },
  {
    key: 'transit', label: 'Mars transit', short: 'Deep space',
    gravity: 'Weightlessness for months', delay: 'About 3 to 22 minutes each way', delaySeconds: 180,
    note: 'There is no quick way home and no live conversation with the ground. The crew must notice problems and act on its own, so routine readings matter more.',
    source: CSA_SCIENCE
  },
  {
    key: 'mars', label: 'Mars surface', short: 'Planetary base',
    gravity: 'About three-eighths of Earth’s gravity', delay: 'About 3 to 22 minutes each way', delaySeconds: 180,
    note: 'Crews adapt to a new gravity after months of weightlessness, with limited medical supplies and no fast help from Earth.',
    source: NASA_HAZARDS
  }
];
export var environmentFor = function(key) {
  return ENVIRONMENTS.find(function(item) { return item.key === key; }) || ENVIRONMENTS[0];
};

// ---------------------------------------------------------------------------
// Clickable body figure. Positions are percentages of the figure's box.
export var BODY_SYSTEMS = [
  {
    key: 'brain', label: 'Brain and mood', x: 50, y: 7,
    indicators: ['mood', 'sleep'],
    note: 'Isolation, confinement, sleep loss and distance from Earth can affect focus and mood. Changes to the eyes and brain (SANS) are also studied: report any change in your vision.',
    library: 'risks'
  },
  {
    key: 'heart', label: 'Heart and blood vessels', x: 42, y: 30,
    indicators: ['pressure', 'heart'],
    note: 'Fluids shift toward the head without gravity, and the heart and blood vessels adapt. Track blood pressure and resting heart rate against your own baseline.',
    library: 'risks'
  },
  {
    key: 'metabolism', label: 'Nutrition and metabolism', x: 50, y: 45,
    indicators: ['glucose'],
    note: 'Meals must stay nutritious and safe for long periods. Glucose helps show how diet, activity and stress affect your body.',
    library: 'risks'
  },
  {
    key: 'immune', label: 'Immune system and skin', x: 22, y: 42,
    indicators: ['temperature'],
    note: 'Spaceflight stress can change immune responses and reawaken dormant viruses, which can cause rashes. Keep dated photos of skin changes in the Mission tab.',
    library: 'risks'
  },
  {
    key: 'bones', label: 'Bones and muscles', x: 60, y: 76,
    indicators: [], guide: 'bones',
    note: 'Bones lose density and muscles weaken without regular loading. Exercise every day and report new pain or weakness.',
    library: 'risks'
  }
];

// Days since a reading was last recorded, for "measurement due" prompts.
export var daysSince = function(value) {
  var date = new Date(value);
  if (isNaN(date.getTime())) return null;
  var start = function(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  return Math.round((start(new Date()) - start(date)) / 86400000);
};
