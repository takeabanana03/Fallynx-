# Fallynx

**Fallynx watches over you when you might fall.**

If your phone feels a fall, it asks *"Are you okay?"* and gives you 15 seconds to answer.
If you don't tap **I'm okay**, it texts your emergency contact with your location on a map
and calls them. It even works on a phone without a SIM card, as long as it has Wi-Fi.

It can also keep an eye on you on the way home (**Safe Walk**), and it keeps your emergency
contacts and medical details safe in your account.

This guide gets Fallynx running on your Android phone from scratch. It takes about an hour the
first time, mostly waiting for things to install. You don't need to be an expert, just follow
the steps in order.

---

## What you'll need

- A Windows or Mac computer
- An **Android phone** (Android 7 or newer) and its USB cable
- About **an hour**
- Three free accounts, which you'll create along the way: **GitHub**, **Supabase** and **Twilio**

---

## Step 1: Install the tools

Install these three programs. For each one, download it, run the installer and keep clicking
**Next**: the default options are fine.

1. **Node.js**: download the **LTS** version from [nodejs.org](https://nodejs.org).
2. **Git**: from [git-scm.com](https://git-scm.com/downloads).
3. **Android Studio**: from [developer.android.com/studio](https://developer.android.com/studio).
   Open it once after installing and let it finish downloading everything. That can take a while.

**Windows only:** tell your computer where the Android tools are.
Search the Start menu for **"Edit environment variables for your account"**, then:
- Click **New**, name it `ANDROID_HOME`, value `%LOCALAPPDATA%\Android\Sdk`
- Select **Path** → **Edit** → **New**, add `%LOCALAPPDATA%\Android\Sdk\platform-tools`

Now **close and reopen** your terminal (or VS Code) and check everything is there:

```
node --version
git --version
adb --version
```

Each one should print a version number. If one says *"not recognized"*, that program didn't
install properly: install it again and reopen the terminal.

---

## Step 2: Get the project

```
git clone https://github.com/takeabanana03/Fallynx-.git
cd Fallynx-
npm install
```

`npm install` downloads everything the app needs. It takes a few minutes the first time.

---

## Step 3: Set up Supabase (your accounts and data)

Supabase is where Fallynx keeps logins, contacts, medical details and alert history.

1. Sign up at [supabase.com](https://supabase.com) and click **New project**.
   Call it `fallynx`, click **Generate a password** (save it somewhere), then **Create new project**.
   Give it a minute or two to get ready.
2. Open **SQL Editor** in the left menu, click **New query**, paste everything from the file
   [`supabase/setup.sql`](supabase/setup.sql) and click **Run**.
   You should see *"Success. No rows returned"*. That's good: your tables are ready.
3. Go to **Authentication → Sign In / Providers → Email**, switch off **Confirm email**, and save.
   This lets you log in straight after creating an account.
4. Go to **Project Settings → API Keys** and keep this page open. You'll copy two things from it
   in Step 5: the **Project URL** and the **Publishable key** (it starts with `sb_publishable_`).

---

## Step 4: Set up Twilio (texts and calls)

Twilio is what sends the text message and makes the phone call when you fall.

1. Sign up at [twilio.com](https://www.twilio.com). The free trial is enough to try Fallynx.
2. Make sure the phone number that should **receive** alerts is **verified** in Twilio.
   If it's the number you signed up with, it already is.
3. On the Twilio home page, copy your **Account SID** (it starts with `AC`).
4. Go to **API keys & auth tokens → Create API key**. Name it `fallynx`, choose **Standard**,
   and copy both the **SID** (starts with `SK`) and the **Secret**.
   Twilio only shows the secret once, so paste it somewhere safe straight away.

On the free trial, Twilio sends its own sample text and sample call instead of the Fallynx
message. That's normal: it still proves everything works. Upgrading Twilio later lets
Fallynx send its real message with the map link.

---

## Step 5: Add your keys

All your keys go in one small file called `.env`. It stays on your computer and is never
uploaded to GitHub.

Make a copy of the example file:

```
copy .env.example .env
```

(On Mac: `cp .env.example .env`)

Open `.env` and fill in the values you collected:

```
EXPO_PUBLIC_SUPABASE_URL=your Supabase Project URL
EXPO_PUBLIC_SUPABASE_KEY=your Supabase publishable key

EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your Twilio Account SID (AC...)
EXPO_PUBLIC_TWILIO_KEY_SID=your Twilio API key SID (SK...)
EXPO_PUBLIC_TWILIO_KEY_SECRET=your Twilio API key secret
EXPO_PUBLIC_TWILIO_FROM=
EXPO_PUBLIC_TWILIO_TRIAL=true

EXPO_PUBLIC_TEST_NUMBER=the phone number that should get alerts, e.g. +23057123456
```

A few things to watch out for:
- No quotes and no spaces around the `=`.
- Leave `EXPO_PUBLIC_TWILIO_FROM` empty while you're on the free Twilio trial.
- While you're testing, **every alert only goes to your test number**, never to real
  contacts or emergency services. That's on purpose.

---

## Step 6: Get your phone ready

1. On the phone, open **Settings → About phone** and tap **Build number** seven times.
   You'll see a message saying you're now a developer.
2. Go to **Settings → Developer options** and turn on **USB debugging**.
3. Plug the phone into your computer and tap **Allow** when the phone asks.
4. Check your computer can see it:

   ```
   adb devices
   ```

   You should see your phone listed with the word `device` next to it.

---

## Step 7: Run Fallynx

**The first time**, install the app on your phone:

```
npx expo run:android
```

This builds the app and installs it, which takes several minutes the first time. When it's
done, Fallynx opens on your phone by itself.

**After that**, whenever you want to run it again:

```
npx expo start
```

Then open Fallynx on your phone. Keep the phone and the computer on the same Wi-Fi.

---

## Step 8: Try it out

1. **Create your account:** type your email and a password, leave **Remember me** on, and tap
   **Create account**. Next time, the app opens without asking you to log in.
2. **Allow the permissions** it asks for: location, notifications and physical activity.
3. **Add an emergency contact** in the **Contacts** tab.
4. **Fill in your Medical ID** in **Settings → Medical ID**, and tap **Save**.
5. **Send a test alert:** on the **Home** screen, tap **Trigger a test alert** and let the
   countdown run out. Your test phone should get a text and a call. You'll also see the
   alert in **Settings → Alert history**.
6. **Try a real fall:** on **Home**, tap the circle so it says **Armed**. Hold the phone upright,
   drop it onto a bed or cushion so it lands flat, and leave it still for 3 seconds.
   The *"Are you okay?"* screen should pop up.

---

## Share it without a computer (optional)

Want Fallynx on a phone that isn't plugged into your computer? Build a standalone app:

```
npx expo prebuild --clean --platform android
npx expo run:android --variant release
```

You'll find the app file at `android/app/build/outputs/apk/release/app-release.apk`.
Send it to another Android phone, open it there, and allow **Install unknown apps**.
Your keys are inside this file, so only share it with people you trust.

---

## If something goes wrong

**Red screen saying "Missing EXPO_PUBLIC_SUPABASE_URL".**
The app can't find your `.env` file. Make sure it's in the main `Fallynx-` folder (next to
`package.json`) and is called exactly `.env`, not `.env.txt`. Then restart with
`npx expo start --clear`.

**"Invalid API key" when logging in.**
The Supabase key in `.env` is wrong. Copy the **Publishable key** again, then restart with
`npx expo start --clear`.

**"No development build installed".**
Run `npx expo run:android` once with the phone plugged in.

**"adb is not recognized".**
Go back to the *Windows only* part of Step 1, then reopen the terminal.

**The alert says "unverified".**
On the free trial, Twilio can only text and call verified numbers. Verify the number in Twilio.

**The alert says "no answer from Twilio".**
The phone isn't connected to the internet. Fallynx needs Wi-Fi or mobile data to send alerts.

**A menu pops up when I drop the phone.**
That's the developer menu, which opens when the phone is shaken. Turn it off: open the menu,
tap **Go home**, open the **Settings** tab, and switch off **Shake device**.

**My fall isn't detected.**
Keep Fallynx open on the screen and make sure **Home** says **Armed**. The phone needs to land
in a different position than it started in, and stay still for 3 seconds.

---

## Good to know

- **Keep Fallynx open on the screen.** Android pauses motion sensors when an app is in the
  background or the screen is off, so falls are only detected while Fallynx is open.
  Detecting falls in the background is the next thing we're working on.
- **Alerts need the internet.** Without Wi-Fi or mobile data, the alert is saved in your
  history, but no text or call goes out.
- **This is a student project.** Please don't rely on it as your only way to get help.

---

Made with care in Mauritius. Questions or ideas? Open an issue on GitHub. We'd love to hear from you.
