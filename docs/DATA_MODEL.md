# Data model

Firestore only. No Realtime Database: one product to learn, and the write
rates here are nowhere near needing it.

## Collections

```
users/{uid}
  name            string
  phone           string
  createdAt       timestamp
  medicalId
    bloodGroup    string
    allergies     string
    medications   string
    conditions    string
    nextOfKin     string

users/{uid}/contacts/{contactId}
  name            string
  phone           string
  relationship    string
  priority        number     1 is contacted first
  watching        boolean    receives push as well as SMS

alerts/{alertId}
  uid             string
  watcherIds      array      uids allowed to read this alert
  type            fall | panic | safe_walk
  status          active | resolved | cancelled
  lat, lng        number
  accuracy        number     metres
  heading         number     degrees, from the magnetometer
  altitudeDelta   number     metres, from the barometer
  battery         number     0 to 1
  sensorTrace     array      the 3 seconds around the impact
  createdAt       timestamp
  resolvedAt      timestamp

journeys/{journeyId}
  uid             string
  watcherIds      array
  destination     string
  etaMinutes      number
  status          active | arrived | overdue | alerted
  lastPing        { lat, lng, at }
  createdAt       timestamp
```

## Why sensorTrace is stored

It is the most valuable field in the schema and the easiest to leave out.

It costs a few kilobytes per alert and gives you: a graph on the history
screen, evidence when a user reports a false positive, and the figures for
your evaluation chapter. Without it, a false alarm is unexplainable.

Cap it at the 3 second window around the impact. Storing more is waste.

## Why watcherIds is denormalised

The security rules need to answer "may this user read this alert" in one
document read. Copying the watcher uids onto the alert makes that a single
`in` check. Looking them up through the contacts subcollection would need a
second read the rules cannot perform.

The cost is that removing a contact does not retroactively cut their access
to old alerts. That is the right trade: an alert is a record of what was true
when it fired.

## Indexes

`alerts` needs a composite index on `uid` ascending, `createdAt` descending
for the history list. Firestore will print the creation link in the console
the first time the query runs.
