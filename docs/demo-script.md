# Roomshift demo script

**Target runtime 2:05.** Start in the app with the fictional example loaded. Keep the event requirements and comparison visible.

| Time | On screen and narration |
| --- | --- |
| 0:00–0:14 | Set **North lift service** to **Out of service**. “The North lift just went out on this fictional campus. We’re moving a 30-person event, and the replacement room needs a step-free route and a projector.” |
| 0:14–0:30 | Point to **Forum 204** changing to **Ineligible** and its **Organizer scenario override** citation. “The simulated outage closes its only documented step-free route. For Projects for Social Good, we’re addressing who can still attend when an event has to move.” |
| 0:30–0:48 | Select **Forum Annex**. “The Annex still qualifies on the supplied evidence. Its access survey lists a route through the West lift, and this service report says the lift is available.” Point to both citations. |
| 0:48–1:04 | Set **West lift service** to **Unverified — no report**. Point to the Annex changing to **Unverified**. “Now we need to confirm West lift service with facilities before announcing the move.” |
| 1:04–1:26 | Set **West lift service** back to **Available**. Set **Attendees** to **45** and apply. “The West lift route is usable again, but there are only 42 seats. The Annex is now ineligible for the larger event.” Show the cited capacity check. |
| 1:26–1:47 | Show [the evaluator](../src/evaluation/evaluateRoom.ts) and [the inspector](../src/EvidenceInspector.tsx). “I defined the workflow and decision rules. Codex implemented the evaluator and workspace. The evaluator returns the IDs of the survey and service report that support an available route. With no usable route and a missing report, it returns Unverified. The inspector shows the sources behind those IDs.” |
| 1:47–2:05 | Return to the app. “Load the example from the demo link or run it with the README’s commands. These decisions use the supplied observations. Check current venue and lift conditions with facilities before announcing a change.” |
