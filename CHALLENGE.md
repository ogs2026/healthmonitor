# How Hubble Health answers the challenge

Challenge: [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/),
NASA Space Apps Challenge 2026. This is our own summary of what the challenge asks for.

## Goals

| The challenge asks for | Where Hubble Health answers it |
| --- | --- |
| Software that gathers health indicators and helps astronauts evaluate and act on their health | Today tab, Check-in, Health review |
| A visual tool to assess one's own health | Clickable body figure (Health tab), colour-coded status, trend charts |
| Guidance on treatments and health improvements | Next step on every review and indicator; measurement and risk guides. The app gives next steps, never medication or doses |
| Input by keyboard, touch or other means; any health indicator | Check-in form, notes, dated photos, Bluetooth discovery on the web |
| Blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood | All six are tracked |
| Which measurements can be done in space, and why | "Can it be measured in space?" on each indicator, plus measurement guides |
| How spaceflight hazards affect the indicators | NASA hazard tags and "Why it matters in space" on each indicator; library topics |
| When a result warrants attention from the crew or flight surgeons | Normal / Check / Urgent levels with demonstration alert limits (`src/challenge.js`) |
| Actions that can prevent a critical condition | Next step per level; "Rest, then recheck" and "Get help now" guidance; due and overdue readings on Today |
| Example: a human figure with clickable body parts showing status | Body status card on the Health tab |

## Considerations

| Consideration | Status |
| --- | --- |
| Different environments (station, Moon, Mars) | Profile → Mission environment. Shows gravity, signal delay and what it means for getting help |
| Prompt astronauts to take measurements as part of a routine | Today tab: readings due, when each was last recorded, and a daily routine checklist |
| Dynamic charts over time | Trend chart on every indicator, blood pressure trend on the Health tab |
| Colour coding for status at a glance | Green, amber, red, grey, always with a word and icon as well |
| Do not assume astronauts know how to assess their health | Plain-language guides, "why it matters" notes and the Space health library |
| Gamification | Kept light on purpose: a progress bar and a routine badge. Streaks could reward hiding symptoms |

## Resources used

All five resources listed on the challenge's Resources tab are used; see the table in
[README.md](README.md#data-sources).

## Known limits

- Alert limits are demonstration values, not clinical thresholds.
- Photos are stored and shown, not analysed. Bluetooth discovery does not import readings.
- Sample check-ins on the website are simulated.
