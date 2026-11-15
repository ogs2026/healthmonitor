// Space health library: plain-language summaries written for Hubble Health
// from public NASA Human Research Program and Canadian Space Agency pages.
// Each topic links back to the official source. No agency logos are used,
// and the app must not suggest that NASA or the CSA endorse it.
//
// `track` entries link a topic to something the user can record in the app:
//   { label, indicator: '<INDICATORS key>' }  -> opens that indicator's history
//   { label, tab: '<tab name>' }               -> opens that tab
//   { label, guide: '<GUIDES key>' }           -> opens that measurement guide

export var LIBRARY_DISCLAIMER = 'Summaries written by Hubble Health from public NASA and Canadian Space Agency (CSA) information. Hubble Health is not affiliated with, sponsored by or endorsed by NASA or the CSA. Links open the agencies’ own websites; NASA is not responsible for information on non-U.S. Government websites, including this app. Follow each website’s own terms of use.';

export var LIBRARY = [
  {
    key: 'hazards',
    title: 'Five hazards of human spaceflight',
    hint: 'Radiation, isolation, distance, gravity, closed environments',
    icon: 'planet-outline',
    agency: 'NASA Human Research Program',
    intro: 'NASA groups the challenges of living in space into five hazards. They do not act alone: one hazard can make the effects of another stronger, so a steady daily routine matters.',
    sections: [
      {
        title: 'Space radiation',
        body: 'Radiation in space is invisible and is one of the most serious hazards of spaceflight. Beyond Earth’s protective atmosphere and magnetic field, exposure rises with mission length and distance.',
        track: [{ label: 'Note symptoms such as unusual fatigue', indicator: 'mood' }, { label: 'Read about radiation monitoring', library: 'radiation' }]
      },
      {
        title: 'Isolation and confinement',
        body: 'Small crews live in tight quarters for months or years. Behavior, mood and teamwork can change, so crews are carefully selected, trained and supported.',
        track: [{ label: 'Mood check-in', indicator: 'mood' }, { label: 'Sleep duration', indicator: 'sleep' }, { label: 'Private reflections', tab: 'Mission' }]
      },
      {
        title: 'Distance from Earth',
        body: 'The farther a crew travels, the harder it is to get supplies, instructions and medical care. A Mars mission could last about three years, so crews must plan carefully and be self-sufficient.',
        track: [{ label: 'Keep your personal ranges current', tab: 'Profile' }, { label: 'Daily check-in', tab: 'Today' }]
      },
      {
        title: 'Gravity fields',
        body: 'Changing gravity affects muscles, bones, the inner ear and the heart and blood vessels. Mars has about three-eighths of Earth’s gravity, and crews also have to readapt when they return.',
        track: [{ label: 'Blood pressure', indicator: 'pressure' }, { label: 'Resting heart rate', indicator: 'heart' }, { label: 'Bone and muscle guide', guide: 'bones' }]
      },
      {
        title: 'Hostile and closed environments',
        body: 'A spacecraft is a closed ecosystem. Temperature, pressure, lighting, noise and air quality must be controlled, and microbes and immune responses are monitored.',
        track: [{ label: 'Body temperature', indicator: 'temperature' }, { label: 'Immune health guide', guide: 'immune' }, { label: 'Skin and symptom photos', tab: 'Mission' }]
      }
    ],
    sources: [{ label: '5 Hazards of Human Spaceflight (NASA)', url: 'https://www.nasa.gov/hrp/hazards/' }]
  },
  {
    key: 'risks',
    title: 'Risks of human spaceflight',
    hint: 'The health risks NASA researches, by body system',
    icon: 'medkit-outline',
    agency: 'NASA Human Research Program',
    intro: 'The five hazards lead to specific health risks that NASA’s Human Research Program studies. Here are the main ones, grouped by area.',
    sections: [
      {
        title: 'Heart and blood vessels',
        body: 'Without gravity, body fluids shift and the heart and blood vessels adapt, which may affect cardiovascular health over long missions.',
        track: [{ label: 'Blood pressure', indicator: 'pressure' }, { label: 'Resting heart rate', indicator: 'heart' }]
      },
      {
        title: 'Bones, muscles and fitness',
        body: 'Bones lose density and can become brittle, and muscle strength and aerobic fitness decline. Regular exercise is the main countermeasure.',
        track: [{ label: 'Bone and muscle guide', guide: 'bones' }, { label: 'Daily mission routine', tab: 'Mission' }]
      },
      {
        title: 'Immune system and microbes',
        body: 'Spaceflight stress can change immune responses and reawaken dormant viruses, which can cause symptoms such as rashes. Skin and gut microbes can also shift.',
        track: [{ label: 'Body temperature', indicator: 'temperature' }, { label: 'Skin and symptom photos', tab: 'Mission' }]
      },
      {
        title: 'Eyes and brain',
        body: 'Spaceflight Associated Neuro-ocular Syndrome (SANS) describes changes to the eyes and brain seen during spaceflight. Report any change in your vision.',
        track: [{ label: 'Note vision changes in your check-in', tab: 'Today' }]
      },
      {
        title: 'Balance and coordination',
        body: 'Gravity changes affect the inner ear, which can cause motion sickness, dizziness and trouble with coordination.',
        track: []
      },
      {
        title: 'Sleep, mood and teamwork',
        body: 'Chronic sleep loss, heavy workloads and disrupted body clocks add to other stresses. Isolation and distance can affect mental health and how well a crew works together.',
        track: [{ label: 'Sleep duration', indicator: 'sleep' }, { label: 'Mood check-in', indicator: 'mood' }]
      },
      {
        title: 'Food and nutrition',
        body: 'Meals must stay nutritious, appealing and safe for long periods. Poor nutrition affects health and performance.',
        track: [{ label: 'Blood glucose', indicator: 'glucose' }, { label: 'Nutrition log', tab: 'Mission' }]
      },
      {
        title: 'Spacewalks and landing',
        body: 'Spacewalks bring fatigue, injury, decompression sickness and low-oxygen risks. Crews can also be injured by forces during landing.',
        track: []
      },
      {
        title: 'Radiation and cancer',
        body: 'Exposure to space radiation may raise the chance of developing cancer later in life.',
        track: [{ label: 'Read about radiation monitoring', library: 'radiation' }]
      }
    ],
    sources: [{ label: 'Risks of Human Spaceflight (NASA)', url: 'https://www.nasa.gov/hrp/risks/' }]
  },
  {
    key: 'research',
    title: 'Ongoing research in space',
    hint: 'Current NASA studies on astronaut health',
    icon: 'flask-outline',
    agency: 'NASA Human Research Program',
    intro: 'NASA’s Human Research Program runs studies on the International Space Station, on Artemis missions and on the ground to protect crews on longer journeys.',
    sections: [
      {
        title: 'Artemis II studies',
        body: 'Research on the crew’s sleep and well-being, on how deep space affects the immune system, and a shared health data bank for future astronauts.',
        track: [{ label: 'Sleep duration', indicator: 'sleep' }]
      },
      {
        title: 'Studies in low Earth orbit',
        body: 'Studies of vision and brain changes, fluid pressure in the head, blood flow and clotting, exercise without a treadmill, and a thigh-cuff test aimed at preventing eye problems.',
        track: [{ label: 'Blood pressure', indicator: 'pressure' }]
      },
      {
        title: 'Earlier studies',
        body: 'Past work covered immune changes, food appeal and diet, spine health, telemedicine devices and growing plants in space for crew well-being.',
        track: [{ label: 'Nutrition log', tab: 'Mission' }]
      }
    ],
    sources: [{ label: 'Ongoing HRP Research (NASA)', url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/' }]
  },
  {
    key: 'radiation',
    title: 'Monitoring radiation for astronaut health',
    hint: 'How Canada measures radiation on the space station',
    icon: 'radio-outline',
    agency: 'Canadian Space Agency',
    intro: 'Space radiation carries enough energy to damage DNA. The Canadian Space Agency helps measure it so crews can be better protected on long missions.',
    sections: [
      {
        title: 'Why it matters',
        body: 'Serious short-term effects are unlikely except during a large solar storm. The main concern is long-term harm, such as cataracts and a higher cancer risk. Exposure depends on altitude, shielding, mission length and the person.'
      },
      {
        title: 'Measuring neutrons',
        body: 'Neutrons make up about 30% of the radiation on the space station and are especially damaging to the body. Canada is developing a compact instrument, the Canadian Active Neutron Spectrometer, that measures them continuously and on its own.'
      },
      {
        title: 'Building on earlier work',
        body: 'It builds on earlier Canadian experiments on the station, including bubble detectors used by astronauts to measure neutron exposure.'
      },
      {
        title: 'How crews are protected',
        body: 'Exposure limits are set for each astronaut’s career, radiation is monitored around the clock, and spacewalks are planned for quieter periods. Exposure is kept as low as reasonably achievable.'
      },
      {
        title: 'Benefits on Earth',
        body: 'The same technology may help with cancer therapy, radiation protection for aircrews and public safety.'
      }
    ],
    sources: [
      { label: 'Monitoring radiation for astronaut health (CSA)', url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp' },
      { label: 'How does radiation affect the human body in space? (CSA)', url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp' }
    ]
  },
  {
    key: 'science',
    title: 'Why do science in space?',
    hint: 'What space research teaches us about health on Earth',
    icon: 'earth-outline',
    agency: 'Canadian Space Agency',
    intro: 'The space station is a laboratory with conditions that cannot be created on Earth. About 200 experiments are on board at any time.',
    sections: [
      {
        title: 'Safer missions',
        body: 'Missions to the Moon and Mars mean longer weightlessness, more radiation, isolation, communication delays and limited medical care. Research aims to understand and reduce these effects on astronauts’ health.'
      },
      {
        title: 'Faster answers about aging',
        body: 'Weightlessness causes changes in the body similar to faster aging and an inactive lifestyle. Six months in orbit can produce data that would take years to gather on the ground.'
      },
      {
        title: 'Benefits on Earth',
        body: 'Canadian research on bones, the heart, blood vessels and the brain has helped with balance problems in older adults, osteoporosis, heart and blood vessel disorders and type 2 diabetes.',
        track: [{ label: 'Blood glucose', indicator: 'glucose' }, { label: 'Blood pressure', indicator: 'pressure' }]
      }
    ],
    sources: [{ label: 'Why do we conduct science experiments in space? (CSA)', url: 'https://asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp' }]
  }
];
