# Roomshift

Roomshift helps student organizers keep campus events accessible after a last-minute venue change. It compares replacement rooms against event requirements and shows the route surveys and lift reports behind each result. When evidence is missing, it tells the organizer what to verify before announcing the move.

**EvoHacks 2 · Projects for Social Good.** A room change can leave attendees who need step-free access without a usable way into the event. Roomshift helps organizers check whether the replacement room still has a documented step-free route before they send the new location.

**Demo.** [Local production preview](http://127.0.0.1:4173/) after setup. A verified public judge link is pending deployment. The campus, rooms, surveys, and lift reports are fictional. Each result is an evaluation of the supplied evidence.

![Roomshift’s computed outage comparison. Forum 204 becomes ineligible, Forum Annex qualifies through the West lift, and Commons 106 remains unverified. The Annex inspector shows the access survey and West lift report.](docs/roomshift-outage.jpg)

## One-minute judge walkthrough

| Time | Try this |
| --- | --- |
| 0:00–0:10 | Select **Load example** for the fictional 30-person event requiring a step-free route and a projector. |
| 0:10–0:26 | Set **North lift service** to **Out of service**. Forum 204 becomes **Ineligible** and cites the scenario override. Forum Annex still **Qualifies**, and Commons 106 stays **Unverified**. |
| 0:26–0:44 | Select **Forum Annex**. The step-free check names the West lift and cites the access survey and the West lift service report. |
| 0:44–1:00 | Set **West lift service** to **Unverified — no report**. The Annex becomes **Unverified**, and the inspector identifies the service report to obtain. |

Set the West lift to **Available**, set **Attendees** to **45**, and select **Apply requirements**. The Annex becomes ineligible because it has 42 seats. Its West lift route still meets the access requirement. Lift edits are labeled as organizer scenario overrides. The baseline uses the original reports with the current room facts and event requirements. **Load example** restores the original reports and sources.

To try your own inputs, select **Use my rooms**. For the default 30-person event with the projector requirement off, add a room with a verified direct route and 18 seats. It is **Ineligible** and the inspector cites the 18-seat observation. Edit the room to 30 seats and it **Qualifies**.

## Run from a clean checkout

Use Node 20.19+ on the 20.x line or Node 22.12+.

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open the [local preview](http://127.0.0.1:4173/). For development, use `npm run dev`.

A clean source copy with Node 24.15.0 and npm 11.12.1 passed installation and production build with the lockfile unchanged. The evaluator suite passed **12 tests, with 0 failures and 0 skips**.

## Publish the demo

1. In [repository settings](https://github.com/Rhythm-Sanghi/Roomshift/settings/pages), choose **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Commit the release changes and push them to `main`. [The Pages workflow](.github/workflows/pages.yml) installs from the lockfile, tests, builds with base `/Roomshift/`, and publishes `dist/`. If Pages was enabled after the push, run **Deploy Roomshift to GitHub Pages** from the Actions tab.
3. Open the [expected Pages address](https://rhythm-sanghi.github.io/Roomshift/) signed out and run the outage and custom room walkthroughs. Add that public URL to the submission once both work.

For a root-path fallback, run `npm ci`, `npm test`, and `npm run build` with the default mode, then upload the resulting `dist/` folder using [Netlify’s drag-and-drop deploy](https://docs.netlify.com/deploy/create-deploys/#drag-and-drop).

## How Roomshift evaluates a room

The [evaluator](src/evaluation/evaluateRoom.ts) takes [room observations](src/roomFacts.ts), event requirements, and current lift reports. It checks capacity for every room and checks step-free access and the projector when required. The [contract](src/evaluation/contract.ts) returns a status, an explanation, and supporting observation IDs for each active requirement. The [inspector](src/EvidenceInspector.tsx) uses those IDs to show the sources.

- One usable surveyed route satisfies step-free access. A direct route needs no lift report. A lift route needs a report that says the lift is available.
- If no route is usable and a lift report is missing, the route check stays **Unverified**. A missing survey is also **Unverified**. A survey confirming no route, or reports confirming all surveyed routes are closed, makes the check **Unmet**.
- Any unmet requirement makes the room **Ineligible**. With no failures, missing evidence for a required check makes it **Unverified**. A room **Qualifies** only when every active requirement is met. The inspector shows every active check.
- The [fictional campus](src/example.ts) and custom rooms use the same evaluator. Observations are entered manually and reset on reload. Confirm current capacity, equipment, and route conditions with the venue or campus facilities before moving an event.

The [test cases](tests/evaluationCases.ts) cover exact capacity, optional requirements, both lifts closed, missing service, missing and empty surveys, and deduplicated citations.

## Contributions

- **Rhythm Sanghi** defined the organizer workflow, decision semantics, fictional outage scenario, and design direction.
- **Codex assistance** implemented the evaluator, workspace, forms, comparison, evidence inspector, types, fictional fixtures, and tests. Codex also verified the build and browser flows and drafted the submission materials.
- **Dependencies** include React and React DOM for the UI, Vite for bundling and preview, TypeScript and React type definitions for type checking, and Node’s built-in test runner. The demo uses fictional observations created for Roomshift.
- **Pre-existing references** include [Threadmark](https://github.com/Rhythm-Sanghi/Threadmark) and [Benchlight](https://github.com/Rhythm-Sanghi/Benchlight). Their interaction and visual patterns informed the design. Roomshift uses its own code and assets. There are no external datasets or sponsor integrations.
