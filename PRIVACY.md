# Skima Privacy Policy

**Effective:** the day version 1.6.0 is released.
**Applies to:** the Skima desktop app (Windows, macOS, Linux, and the Microsoft Store copy), the Docker image, the online demo, and the Skima website.

## The short version

Your team's data stays on your device or your server. Skima has no account, and no server of ours stores your organization, your people, their skills or their evaluations. Two things make the app talk to the internet on its own, and you can turn off either one: an anonymous daily check-in that tells us Skima is still in use, and a check with GitHub for a newer version. Skima tells you about the check-in the first time you open it, and **Settings → About** turns it off at any time. The website uses cookieless analytics that never identify you.

## What Skima stores, and where

Skima stores your organization, its people, skills, evaluations, development plans and settings in a local SQLite database: in the app's data folder on the desktop, or in the data volume you give the Docker container. We do not upload, sync or back it up. Uninstalling the Microsoft Store copy deletes its data; use **Settings → Backup & Restore** first.

## What the app sends

Two things, and each one can be turned off. Nothing else. There is no crash reporting and no third-party analytics or advertising code inside the app. Both requests are made by Skima's own server process (`server/src`), not by the screen you see.

### The anonymous check-in

On a new installation the check-in is on from the start, and Skima says so the first time it opens, with a link to see exactly what is sent and to turn it off. Copies updated from an earlier version also start with it on, and show the same notice once.

At most once a day, and only on a day Skima is used, it sends six things to a server we run ourselves:

- a random number made on your device. It is derived from nothing about you, your organization or your device, and is tied to no name, email or account;
- the app version, for example `1.6.0`;
- your operating system, as one word: `windows`, `macos` or `linux`;
- the processor type, for example `x64` or `arm64`;
- how Skima was installed, as one word, for example `installer`, `store`, `dmg`, `appimage`, `deb` or `docker`;
- the date.

That is everything. It never includes your organization's name, your people, their skills, evaluations or plans, your language, your location, or anything typed into Skima. **Settings → About → What gets sent** shows the exact values your copy sends. The code is one file, `server/src/checkin.js`.

### Where it goes and what we keep

The message goes to [Umami](https://umami.is), an open-source analytics tool we host ourselves. Like any server you connect to, ours sees the internet address your connection is using. We do not store it, we do not derive your country or city from it, and the web server in front of Umami does not log it. We keep the messages as they arrive for thirteen months. After that only daily totals remain, such as how many copies checked in on a given day, and the messages themselves are deleted.

### Turning it off

- **Desktop and Docker:** the switch is in **Settings → About**, under **Anonymous check-in**. When you turn it off, Skima sends one last message with the same six things and a mark saying it is the last one, deletes the random number, and sends nothing more. If you turn it on again later, a new random number is made, and the two cannot be joined. We do not delete the earlier messages when you turn it off, because that would mean sending your copy's number once more; they expire with everything else after thirteen months.
- **Docker, before it ever starts:** set the environment variable `SKIMA_DISABLE_CHECKIN` (any value) and nothing is ever sent.
- **Built from source or a fork:** sends nothing. The address is added only when we build the official releases.
- **The online demo:** never sends.

### What this is for

The check-in tells us how many copies of Skima are in use from one week to the next, and how they were installed. It cannot tell us who you are, and we do not try.

### The update check

The desktop app asks GitHub whether a newer version exists each time it starts, by downloading a small file from Skima's GitHub releases. You can turn it off in **Settings → About**. The Microsoft Store copy does not do this: the Store updates it. GitHub's [privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) applies to that request.

## The online demo

The demo is a shared Skima server with sample data. Anything you enter there can be seen by other visitors until the demo resets, every few hours. Do not enter real people's information in it.

## The website

The Skima website uses Umami, hosted by us, to count page views and clicks on the demo, download and GitHub buttons. Umami does not use cookies, does not store your IP address, does not fingerprint your browser, and does not track you across other sites. There is no advertising, and no data is shared with third parties.

## Downloads

Release files are hosted on GitHub, and the Docker image on GitHub Container Registry; GitHub's privacy statement applies to those downloads. The Microsoft Store's own policy applies to installing and updating the Store copy.

## Children

Skima collects no personal data from anyone, including children.

## Your rights

The check-in holds nothing that identifies you, so there is nothing we could find, correct or export for you. Your team's data is on your device or your server, under your control: export it, back it up, or delete it.

## Changes

If this policy changes, the new version is published here with a new effective date, and substantive changes are announced in the release notes.

## Contact

Open an issue at [github.com/henfrydls/Skima/issues](https://github.com/henfrydls/Skima/issues).

Skima is a [DLSLabs](https://henfrydls.com) project, released under the GNU AGPL-3.0.
