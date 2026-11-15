# Releasing Hubble Health to the App Store and Google Play

The project is already set up for store builds: app name **Hubble Health**, iOS bundle ID and Android package **`com.hubblehealth.app`**, version **1.0.0**, icon, splash screen, permission wording and EAS build/submit profiles (`eas.json`). The steps below are the ones only you can do, because they need your accounts and payment.

Builds run in Expo's cloud (EAS), so **you do not need a Mac, Xcode or Android Studio**.

## 1. Before you start (one time)

1. **Apple Developer Program**: enroll at https://developer.apple.com/programs/ ($99 per year). Enrolling as an organization needs a D-U-N-S number and can take a few days; as an individual it is usually same day.
2. **Google Play Console**: register at https://play.google.com/console ($25 one time). Google verifies your identity, which can take a few days.
3. **Expo account**: free at https://expo.dev/signup.
4. Install Node.js 20 or newer from https://nodejs.org.
5. **Check the name.** The app now quotes NASA and CSA material, and the Hubble Space Telescope is a NASA mission, so reviewers may read "Hubble" as implying NASA ties. The app says clearly that it is independent; never use agency logos or "NASA" in the app name, subtitle, icon or screenshots' captions. Also search both stores and a trademark database for "Hubble Health" before you pay for anything. Store names must be unique, and "Hubble" is used by other health and eye-care brands.
6. **App IDs.** `com.hubblehealth.app` must be unique worldwide and **can never change after the first upload**. If you own a domain, consider using it reversed, for example `com.yourcompany.hubblehealth`. Change it in `app.json` (`ios.bundleIdentifier` and `android.package`) before your first build.

## 2. Publish the privacy policy

Both stores require a public privacy policy link.

1. Open `store/PRIVACY_POLICY.md` and fill in the bracketed parts: your name or company, support email, date. Delete the "Draft" note.
2. Put `store/privacy-policy.html` online with the same edits. Free options: GitHub Pages, Netlify Drop (drag and drop the file at https://app.netlify.com/drop), or a page on your own website.
3. Keep the link handy for steps 5 and 6.

## 3. Set up the project on your computer

```bash
unzip hubble-health.zip && cd hubble-health
npm install
npx eas-cli@latest login
npx eas-cli@latest init        # links the project to your Expo account
```

Optional: try it on your phone first with `npm start` and the **Expo Go** app.

## 4. Build the apps

```bash
npm run build:ios        # EAS asks to sign in to Apple and creates certificates for you; say yes
npm run build:android    # EAS creates and stores your Android signing key; say yes
```

Each build takes about 10 to 20 minutes and gives you a link on expo.dev. Build numbers go up automatically.

Want to test on an Android phone first? `npm run build:preview` makes an APK you can install directly.

## 5. App Store (iPhone)

1. In **App Store Connect** (https://appstoreconnect.apple.com) go to **Apps → + → New App**. Platform iOS, name **Hubble Health**, bundle ID `com.hubblehealth.app`, SKU `hubble-health`.
2. Upload the build: `npm run submit:ios`. It appears in **TestFlight** after Apple processes it (about 15 to 30 minutes). Install it through TestFlight and check it on a real iPhone.
3. Fill in the listing, using `store/listing.md` for the text:
   - Screenshots: use the files in `store/screenshots/ios-6.9/` (1320 × 2868).
   - Category: **Health & Fitness**.
   - Privacy policy URL from step 2.
   - **App Privacy**: answer **"No, we do not collect data from this app"**. That is accurate: nothing leaves the device.
   - Age rating questionnaire: answer "Medical/Treatment Information: Infrequent/Mild".
   - Export compliance is already answered in the app config (no non-exempt encryption).
4. In "App Review Information" add a note: *"No login required. All data is stored on the device. The app records readings the user types in and does not diagnose."*
5. Select the build, then **Add for Review → Submit**. Review usually takes 1 to 3 days.

## 6. Google Play (Android)

1. In **Play Console** go to **Create app**. Name **Hubble Health**, app, free.
2. **The first upload must be done by hand** (Google requires it): download the `.aab` from the Android build page on expo.dev, then upload it in **Testing → Internal testing → Create new release**.
3. Complete **App content** (Policy → App content):
   - Privacy policy: the URL from step 2.
   - Ads: **No**.
   - Data safety: **No data collected, no data shared**. All data is processed only on the device.
   - **Health apps declaration**: choose the categories that fit, such as "Health and fitness tracking" and "Medical reference and education".
   - Target audience: 18+ (or 13+), not children.
   - Content rating questionnaire.
4. **Store listing**: text from `store/listing.md`, the 512 × 512 icon `store/play-icon-512.png`, the feature graphic `store/play-feature-graphic.png` and the phone screenshots in `store/screenshots/android/`.
5. **New personal developer accounts** must run a **closed test with at least 12 testers for 14 days** before Google allows production. Add testers (Gmail addresses) under **Testing → Closed testing**, then apply for production access. Organization accounts skip this.
6. For later releases, automate uploads: create a Google service account key (https://expo.fyi/creating-google-service-account), then run `npm run submit:android`.

## 7. Updating the app later

1. Make your changes.
2. Raise `version` in `app.json` for user-visible releases, for example 1.0.0 → 1.1.0. Build numbers update automatically.
3. Run the build and submit commands again.
