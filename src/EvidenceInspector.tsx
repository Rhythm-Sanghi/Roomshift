import type { RequirementId, RoomEvaluation } from './evaluation/contract';
import type { Observation, RoomFacts, RouteAvailability } from './roomFacts';

export const requirementLabels: Record<RequirementId, string> = {
  capacity: 'Capacity',
  'step-free': 'Step-free route',
  projector: 'Projector',
};

const checkLabels = { met: 'Met', unmet: 'Unmet', unverified: 'Unverified' };

export function serviceLabel(value: string | undefined) {
  if (value === 'available') return 'Available';
  if (value === 'out-of-service') return 'Out of service';
  return 'Unverified';
}

function ObservationLine({ observation, value }: {
  observation: Pick<Observation<unknown>, 'id' | 'source'> | null;
  value: string;
}) {
  return (
    <div className="observation">
      <strong>{value}</strong>
      {observation && <span className="source">Source · {observation.source}</span>}
    </div>
  );
}

export function EvidenceInspector({ id, room, availability, evaluation, onEdit }: {
  id: string;
  room: RoomFacts | undefined;
  availability: RouteAvailability;
  evaluation: RoomEvaluation | undefined;
  onEdit: () => void;
}) {
  const routes = room?.stepFreeRoutes;
  const projectorValue = room?.projector ? (room.projector.value ? 'Present' : 'Absent') : 'Unverified';
  const routeValue = routes ? (routes.value.map(route => route.label).join(' · ') || 'No step-free route') : 'Unverified';
  const elevatorRoutes = new Map<string, string>();
  for (const route of routes?.value ?? []) {
    if (route.elevatorId && !elevatorRoutes.has(route.elevatorId)) {
      elevatorRoutes.set(route.elevatorId, route.label);
    }
  }
  const observations = new Map<string, { value: string; source: string }>();
  function recordObservation(observation: Observation<unknown> | null | undefined, value: string) {
    if (observation) observations.set(observation.id, { value, source: observation.source });
  }

  if (room?.seats) recordObservation(room.seats, room.seats.value + ' seats');
  recordObservation(room?.projector, 'Projector ' + projectorValue.toLowerCase());
  recordObservation(routes, routeValue);
  for (const [id, label] of elevatorRoutes) {
    const report = availability[id];
    recordObservation(report, label + ' · ' + serviceLabel(report?.value));
  }

  return (
    <aside id={id} tabIndex={-1} className="inspector" aria-labelledby={id + '-heading'}>
      <div className="section-bar"><h2 id={id + '-heading'}>Evidence inspector</h2></div>
      {room ? (
        <>
          <div className="inspector-title">
            <div><h3>{room.name}</h3>{room.location && <p className="muted">{room.location}</p>}</div>
            <button onClick={onEdit}>Edit room</button>
          </div>
          {evaluation && (
            <section className="inspector-section" aria-label="Requirement checks">
              <h4>Requirement checks</h4>
              <ul className="check-list">
                {evaluation.evidence.map(check => (
                  <li key={check.requirement}>
                    <div className="check-title"><strong>{requirementLabels[check.requirement]}</strong><span className={'status ' + check.status}>{checkLabels[check.status]}</span></div>
                    <p>{check.explanation}</p>
                    {check.observationIds.length > 0 && (
                      <ul className="citations" aria-label="Cited observations">
                        {check.observationIds.map(observationId => {
                          const observation = observations.get(observationId);
                          return (
                            <li key={observationId}>
                              {observation && <><strong>{observation.value}</strong> · {observation.source}</>}
                              <span className="citation-id">ID · <code>{observationId}</code></span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="inspector-section" aria-label="Recorded observations">
            <h4>Recorded observations</h4>
            <dl className="facts">
              <div className="fact-pair"><dt>Seats</dt><dd><ObservationLine observation={room.seats} value={room.seats ? String(room.seats.value) : 'Unverified'} /></dd></div>
              <div className="fact-pair"><dt>Projector</dt><dd><ObservationLine observation={room.projector} value={projectorValue} /></dd></div>
              <div className="fact-pair"><dt>Step-free route</dt><dd><ObservationLine observation={routes ?? null} value={routeValue} /></dd></div>
              {[...elevatorRoutes].map(([id, label]) => (
                <div className="fact-pair" key={id}>
                  <dt>Elevator service<span className="service-route">{label}</span></dt>
                  <dd><ObservationLine observation={availability[id] ?? null} value={serviceLabel(availability[id]?.value)} /></dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : <p className="empty-inspector">Add a room with its seat count and any confirmed access or equipment details to see what still needs checking.</p>}
    </aside>
  );
}
