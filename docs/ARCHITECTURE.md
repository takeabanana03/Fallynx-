# Architecture

Four layers, each of which knows only about the layer below it.

```
  Screens          Home, Sensors, Safe Walk, Contacts, Settings, Countdown
     |
  Trigger bus      one event, three sources
     |
  Dispatch         location -> call -> SMS -> Firestore -> push
     |
  Services         sensors, detection, location, firebase, storage
```

## The one rule worth enforcing

`src/services/detection/` is pure JavaScript. It imports nothing from React,
nothing native, nothing from Firebase. It takes numbers and returns a state.

This is what makes `replay.js` work: you can feed a recorded CSV through the
detector on any machine and get the same answer the phone would give. Tuning
becomes measurement instead of guesswork, and the confusion matrix it
produces goes straight into your report.

The moment the detector imports a sensor library, that stops being true.

## Why the trigger bus exists

A fall, a shake, a triple volume press and the on-screen button all mean the
same thing: raise an alert. Without a bus, each one grows its own copy of the
dispatch logic and they drift apart.

Instead every source calls `fire(SOURCE.X)` and the dispatcher is the only
subscriber. Adding a trigger in Phase 6 needs no change to dispatch code, and
the shared debounce means two sources firing together produce one alert.

## Why dispatch order is fixed

```
1. location    10 second timeout, falls back to last known
2. call        works with no data
3. SMS         works with no data
4. Firestore   needs data, queued and retried if offline
5. push        cloud function, needs data
```

Steps 2 and 3 are the ones that matter in a sugarcane field with one bar of
signal. They run before anything that could block on the network. If Firebase
is down, help has already been called.

## Where state lives

| State | Where | Why |
|---|---|---|
| Sensor samples | `RingBuffer` in memory | Last 3 seconds only, never persisted |
| Medical ID | AsyncStorage + Firestore | Must read with no signal |
| Contacts | AsyncStorage + Firestore | Same |
| Alert history | Firestore | Needs to reach other devices |
| Onboarding, battery ack | AsyncStorage | Device specific |
| Thresholds | `config/thresholds.js` | One file, no value hardcoded elsewhere |

No Redux, no Context provider, no state library. Screens read what they need
on focus. At this size anything more is ceremony.

## Screen map

| Screen | Phase | Reached from |
|---|---|---|
| Onboarding | 1 | Launch, when not yet onboarded |
| Home | 1 | Tab |
| Settings | 1 | Tab |
| Sensors | 2 | Tab |
| Countdown | 4 | Full screen, over everything |
| Contacts | 5 | Tab |
| Medical ID | 5 | Stack, from Contacts |
| History | 5 | Stack |
| Safe Walk | 7 | Tab |

Every unbuilt screen is a three-line file wrapping `PhaseStub`. Replacing one
with the real thing touches that file only.
