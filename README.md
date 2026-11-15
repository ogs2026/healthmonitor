# Hubble Health

A daily health check-in and guidance companion for astronauts on long-duration missions, built for the
NASA Space Apps Challenge 2026 challenge
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

One codebase (Expo / React Native) runs as a **website on Vercel** and as **iOS and Android apps**.
How each part answers the challenge is in [CHALLENGE.md](CHALLENGE.md).

> Hubble Health organizes observations; it does not diagnose or replace medical advice. It is not
> affiliated with, sponsored by or endorsed by NASA or the Canadian Space Agency.

## Deploy to Vercel (about 5 minutes)

Everything Vercel needs is already in [`vercel.json`](vercel.json): install `npm ci`, build
`npm run build`, output folder `dist`. There are no environment variables and no server.

1. **Put the code on GitHub.** Create an empty repository named `hubble-health` at
   https://github.com/new (no README, no .gitignore, no license), then in this folder:

   ```bash
   git remote add origin https://github.com/<your-username>/hubble-health.git
   git push -u origin main
   ```

2. **Import it in Vercel.** Go to https://vercel.com/new, choose **Import Git Repository**, pick
   `hubble-health` and press **Deploy**. Leave the framework preset as "Other"; the settings come from
   `vercel.json`.
3. **Done.** Vercel gives you a URL like `https://hubble-health.vercel.app`. Every push to `main`
   redeploys it, and every pull request gets its own preview URL.

The privacy policy is served at `/privacy` on the same site, which you can use as the privacy policy
link in the App Store and Google Play (fill in the bracketed parts of `public/privacy.html` first).

## Run it on your computer

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # opens the web app at http://localhost:8081
npm run build      # builds the website into dist/, exactly as Vercel does
npm start          # phone: scan the QR code with Expo Go, or press i / a for a simulator
```

## What it does

- **Today**: the mission environment (space station, Moon, Mars transit or Mars surface) with its
  gravity and signal delay to Earth, an attention card when a recent reading needs a recheck or help,
  and the readings still due today with when each was last recorded.
- **Check-in → Health review**: blood pressure, heart rate, blood glucose, body temperature, sleep and
  mood. Each result gets a colour and a word (Normal, Check, Urgent) and a next step.
- **Health**: a clickable body figure whose markers show the status of each body system, the blood
  pressure trend and every indicator's latest value.
- **Indicator details**: a colour-coded trend chart, why the reading matters in space (linked to NASA's
  five hazards), whether and how it can be measured in space, what to do now, and the source.
- **Measures**: measurement guides, spaceflight risk guides and the **Space health library** (plain-language
  summaries of the five resources listed on the challenge page, with links to the originals).
- **Mission**: body-system notes, dated skin and symptom photos, Bluetooth device discovery (web),
  nutrition log, private reflections, daily routine.
- **Profile**: name, mission start date, mission environment, personal reference ranges, and
  "Delete all my data".

All data stays on the device (localStorage on the web, AsyncStorage on phones). Nothing is sent to a
server. The website adds six days of **simulated** sample check-ins on first launch so there is
something to look at; the phone apps start empty.

### Status levels

| Level | Meaning |
| --- | --- |
| Normal (green) | Inside your personal reference range (Profile) |
| Check (amber) | Outside your personal range, or a low mood |
| Urgent (red) | Past a demonstration alert limit (for example systolic 180 or more, temperature 38.5 °C or more, glucose under 54 mg/dL), or a very low mood |

The alert limits are in `src/challenge.js` (`ALERT_LIMITS`). They are demonstration values; a crew's
flight surgeon sets the real ones.

## Data sources

The challenge's Resources tab lists these five pages. Each is summarized in our own words in
`src/library.js` and linked from the app; facts used elsewhere (`src/challenge.js`) cite them too.

| Resource | Where it is used |
| --- | --- |
| [NASA: 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | Library topic; hazard tags on every indicator; gravity on the Moon and Mars for the mission environments |
| [NASA: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | Library topic; "Why it matters in space" for each indicator; body-system notes on the body figure |
| [NASA: Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Library topic (Artemis II and station studies on sleep, immunity, vision, blood flow) |
| [CSA: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Library topic on radiation and how crews are protected |
| [CSA: Why do we conduct science experiments in space?](https://asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | Library topic; deep-space challenges (delays, limited care) for the Mars environments |

Signal delays are light travel time for typical Earth–Moon and Earth–Mars distances. Sample check-ins are
simulated. No agency logos are used.

## Publishing to the App Store and Google Play

The Vercel setup does not change the store setup: `app.json` and `eas.json` are unchanged. See
**[store/STORE_RELEASE.md](store/STORE_RELEASE.md)** for the step-by-step guide.

## Project layout

| Path | What it is |
| --- | --- |
| `vercel.json` | Vercel build settings, single-page routing and cache headers |
| `App.js`, `index.js` | App entry and navigation container |
| `src/HealthMonitor.js` | All screens |
| `src/challenge.js` | Status levels, alert limits, mission environments, body systems, space context per indicator |
| `src/library.js` | Space health library content with source links |
| `src/platform-hooks.js` | Storage, camera and Bluetooth helpers (web and native) |
| `public/` | Files copied to the website as they are (`privacy.html`) |
| `store/` | Store listing text, screenshots, privacy policy draft, release guide |

## License

MIT, see [LICENSE](LICENSE).
