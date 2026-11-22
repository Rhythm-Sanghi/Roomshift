# Roomshift Devpost draft

## Project name

Roomshift

## Short description

Help student organizers keep campus events accessible after a last-minute venue change. Compare replacement rooms, inspect their route surveys and lift reports, and see what to verify before announcing the move.

## Try the demo

Load the fictional campus and mark the **North lift** out of service. Based on the supplied evidence, Forum 204 loses its only documented step-free route and cites the organizer’s scenario override. Forum Annex still qualifies through the **West lift**. Select the Annex to see the access survey and the lift service report behind that result. Commons 106 stays **Unverified** because it has no route survey.

Remove the West lift report and the Annex becomes **Unverified**. Set the West lift back to **Available**, then raise attendance from 30 to 45. The Annex becomes **Ineligible** because it has 42 seats, even though its West lift route still meets the access requirement. The same evaluator handles manually entered rooms.

**Demo** [Open Roomshift](https://rhythm-sanghi.github.io/Roomshift/). The [local setup and one-minute walkthrough](../README.md) are available as a fallback. **Source repository** [Rhythm-Sanghi/Roomshift](https://github.com/Rhythm-Sanghi/Roomshift). **Video** [Recording URL pending].

## The problem

When a student organizer has to move an event at short notice, the replacement address can change who is able to attend. A room may have enough seats and the right equipment while its only step-free route depends on an out-of-service lift. The organizer needs to know which rooms meet all the event requirements and which details to confirm with facilities before sending the update.

The fictional outage demonstrates how the organizer can rule out one room, inspect a supported fallback, and identify an unresolved fact. The browser flows were verified with fictional observations. Real-world usefulness has yet to be validated with an organizer.

## Projects for Social Good

Roomshift addresses a campus inclusion problem. By showing when a venue disruption closes the only documented step-free route, and what evidence supports a replacement, it helps organizers account for attendees who need step-free access. When a lift report is missing, the organizer can see what to verify before announcing a room that some attendees may be unable to reach.

## How it works

Roomshift checks every active requirement and attaches the supporting observation IDs. A verified failure makes a room ineligible. If nothing fails but a required observation is missing, the room stays unverified. One usable surveyed route can satisfy step-free access, and a missing lift report leaves an otherwise unresolved route unverified.

The app runs in the browser using manually supplied observations. It helps organizers compare options and decide what to verify. Confirm current venue and route conditions with campus facilities before moving an event.

## Built for this entry

Rhythm Sanghi defined the organizer workflow, decision rules, outage demonstration, and design direction. Codex implemented the evaluator, browser UI, forms, comparison, inspector, types, fixtures, and tests. Codex also assisted with writing and ran build and browser verification.

Roomshift uses React, React DOM, TypeScript, Vite, and Node’s built-in test runner. Threadmark and Benchlight were pre-existing design references. The fictional observations and assets are original to Roomshift. The demo uses no external dataset or sponsor integration. [Full credits](../README.md#contributions)
