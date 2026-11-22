import { useRef, useState, type FormEvent } from 'react';
import { EvidenceInspector, serviceLabel } from './EvidenceInspector';
import { RoomForm } from './RoomForm';
import { blankInputs, example, exampleElevator, exampleWestElevator } from './example';
import { evaluateRoom } from './evaluation/evaluateRoom';
import type { RoomEvaluation, RoomStatus } from './evaluation/contract';
import type { EventRequirements, RoomFacts, RoomInputs, ServiceStatus } from './roomFacts';

const customElevator = { id: 'shared-elevator', label: 'Shared elevator' };
const exampleElevators = [exampleElevator, exampleWestElevator];
const resultLabels: Record<RoomStatus, string> = {
  qualifies: 'Qualifies',
  ineligible: 'Ineligible',
  unverified: 'Unverified',
};

function RequirementsForm({ requirements, onSave }: { requirements: EventRequirements; onSave: (value: EventRequirements) => void }) {
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const attendees = Number(fields.get('attendees'));
    if (!Number.isSafeInteger(attendees) || attendees < 1) {
      setError('Enter a positive whole number of attendees.');
      return;
    }
    setError('');
    onSave({ attendees, stepFree: fields.has('stepFree'), projector: fields.has('projector') });
  }

  return (
    <form className="requirements-form" onSubmit={submit}>
      <label className="attendance">Attendees<input name="attendees" type="number" required min="1" step="1" defaultValue={requirements.attendees} /></label>
      <label className="checkbox"><input name="stepFree" type="checkbox" defaultChecked={requirements.stepFree} />Step-free route required</label>
      <label className="checkbox"><input name="projector" type="checkbox" defaultChecked={requirements.projector} />Projector required</label>
      <button type="submit">Apply requirements</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

function routeLabel(room: RoomFacts, result: RoomEvaluation) {
  const routeCheck = result.evidence.find(check => check.requirement === 'step-free');
  if (routeCheck?.status === 'met') return routeCheck.explanation;
  if (routeCheck?.status === 'unmet') return 'No usable route';
  if (routeCheck?.status === 'unverified') return 'Unverified';
  if (!room.stepFreeRoutes) return 'Unverified';
  const routes = room.stepFreeRoutes.value;
  if (!routes.length) return 'No route';
  return routes.some(route => route.elevatorId === null) ? 'Direct entry' : 'Via elevator';
}

function NoQualifyingRooms({ results }: { results: readonly RoomEvaluation[] }) {
  if (!results.length || results.some(result => result.status === 'qualifies')) return null;
  const failed = results.filter(result => result.status === 'ineligible').length;
  const unverified = results.length - failed;

  return (
    <div className="comparison-note">
      <strong>No room qualifies</strong>
      <p>{failed} ineligible · {unverified} unverified</p>
      {failed > 0 && <p>Inspect the unmet requirements and look for another room.</p>}
      {unverified > 0 && <p>Check the missing observations with campus facilities before deciding.</p>}
    </div>
  );
}

export function App() {
  const [inputs, setInputs] = useState<RoomInputs>(example);
  const [exampleMode, setExampleMode] = useState(true);
  const [formRevision, setFormRevision] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(example.rooms[0]?.id);
  const [roomEditor, setRoomEditor] = useState<{ room: RoomFacts | null } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const addRoomButton = useRef<HTMLButtonElement>(null);
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  const evaluatedRooms = inputs.rooms.map(room => ({
    room,
    evaluation: evaluateRoom(room, inputs.requirements, inputs.availability),
  }));
  const selection = evaluatedRooms.find(({ room }) => room.id === selectedRoomId);
  const selectedRoom = selection?.room;
  const elevator = exampleMode ? exampleElevator : customElevator;
  const elevators = exampleMode ? exampleElevators : [customElevator].filter(candidate =>
    inputs.rooms.some(room => room.stepFreeRoutes?.value.some(route => route.elevatorId === candidate.id)),
  );
  const serviceChanged = exampleMode && elevators.some(candidate =>
    inputs.availability[candidate.id]?.value !== example.availability[candidate.id]?.value,
  );

  function reset(useExample: boolean) {
    const next = useExample ? example : blankInputs;
    setExampleMode(useExample);
    setInputs(next);
    setSelectedRoomId(next.rooms[0]?.id);
    setRoomEditor(useExample ? null : { room: null });
    editorTrigger.current = null;
    setFormRevision(revision => revision + 1);
    setAnnouncement(useExample ? 'Fictional example loaded.' : 'Custom workspace opened.');
  }

  function updateRequirements(requirements: EventRequirements) {
    setInputs(current => ({ ...current, requirements }));
    setAnnouncement('Event requirements applied.');
  }

  function updateService(changedElevator: { id: string; label: string }, value: ServiceStatus | '') {
    const { id, label } = changedElevator;
    const previousReport = inputs.availability[id] ?? (exampleMode ? example.availability[id] : undefined);
    const nextInputs = {
      ...inputs,
      availability: {
        ...inputs.availability,
        [id]: value ? {
          id: previousReport?.id ?? id + '-status',
          source: previousReport?.source ?? 'Organizer service report',
          value,
        } : undefined,
      },
    };
    setInputs(nextInputs);
    const result = selectedRoom && evaluateRoom(selectedRoom, nextInputs.requirements, nextInputs.availability);
    setAnnouncement(label + ': ' + serviceLabel(value) + (result && selectedRoom
      ? '. ' + selectedRoom.name + ' result: ' + resultLabels[result.status] + '.'
      : '.'));
  }

  function closeEditor() {
    setRoomEditor(null);
    (editorTrigger.current ?? addRoomButton.current)?.focus();
  }

  function saveRoom(room: RoomFacts) {
    setInputs(current => ({
      ...current,
      rooms: roomEditor?.room
        ? current.rooms.map(existing => existing.id === room.id ? room : existing)
        : [...current.rooms, room],
    }));
    setSelectedRoomId(room.id);
    setAnnouncement(room.name + ' saved. Evidence inspector updated.');
    closeEditor();
  }

  return (
    <>
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <header className="app-header">
        <div className="header-inner">
          <strong className="brand"><span className="brand-mark" aria-hidden="true" />Roomshift</strong>
          <div className="actions">
            <button className="primary" onClick={() => reset(true)}>Load example</button>
            <button onClick={() => reset(false)}>Use my rooms</button>
          </div>
        </div>
      </header>
      <main id="workspace" tabIndex={-1}>
        <div className="page-heading">
          <h1>Compare replacement rooms</h1>
          <p>Check room evidence against what your event needs.</p>
        </div>

        <section className="event-panel" aria-labelledby="event-heading">
          <div className="section-bar"><h2 id="event-heading">Event requirements</h2></div>
          <RequirementsForm key={formRevision} requirements={inputs.requirements} onSave={updateRequirements} />
          {elevators.map(candidate => {
            const service = inputs.availability[candidate.id];
            const original = exampleMode ? example.availability[candidate.id] : undefined;
            const controlId = candidate.id + '-service';
            return (
              <div className="service-bar" key={candidate.id}>
                <label htmlFor={controlId}>{candidate.label} service</label>
                <select id={controlId} value={service?.value ?? ''} onChange={event => updateService(candidate, event.target.value as ServiceStatus | '')}>
                  <option value="available">Available</option>
                  <option value="out-of-service">Out of service</option>
                  <option value="">Unverified — no report</option>
                </select>
                {original && service?.value !== original.value && <span className="change-note"><strong>Changed</strong> · {serviceLabel(original.value)} → {serviceLabel(service?.value)}</span>}
                {service && <span className="source">Source · {service.source}</span>}
              </div>
            );
          })}
        </section>

        <div className="workspace-notice">
          <strong>{exampleMode ? 'Fictional example' : 'Custom input'}</strong>
          <p>{exampleMode
            ? 'Set the North lift out of service, then select a room to inspect the evidence behind its result.'
            : 'Select a room to inspect how its supplied observations meet the event requirements.'}</p>
        </div>

        <div className="workspace-grid">
          <section className="comparison" aria-labelledby="comparison-heading">
            <div className="section-bar">
              <h2 id="comparison-heading">Room comparison</h2>
              <button ref={addRoomButton} onClick={event => { editorTrigger.current = event.currentTarget; setRoomEditor({ room: null }); }}>Add room</button>
            </div>
            {roomEditor && <RoomForm key={roomEditor.room?.id ?? 'new'} room={roomEditor.room} elevator={elevator} onSave={saveRoom} onCancel={closeEditor} />}
            <NoQualifyingRooms results={evaluatedRooms.map(({ evaluation }) => evaluation)} />
            {serviceChanged && <p id="baseline-description" className="comparison-note muted">The baseline uses the original lift reports with the current room facts and event requirements.</p>}
            {inputs.rooms.length > 0 ? (
              <table className={serviceChanged ? 'before-and-after' : undefined} aria-describedby={serviceChanged ? 'baseline-description' : undefined}>
                <thead>
                  <tr>
                    <th scope="col">Room</th>
                    <th scope="col">Step-free route</th>
                    {serviceChanged && <th scope="col" className="previous-status">Baseline</th>}
                    <th scope="col">{serviceChanged ? 'Current' : 'Result'}</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluatedRooms.map(({ room, evaluation: result }) => {
                    const before = serviceChanged ? evaluateRoom(room, inputs.requirements, example.availability) : undefined;
                    const changed = before !== undefined && before.status !== result.status;
                    return (
                      <tr key={room.id} className={selectedRoomId === room.id ? 'selected' : undefined}>
                        <th scope="row">
                          <button className="room-option" aria-pressed={selectedRoomId === room.id} onClick={() => {
                            setSelectedRoomId(room.id);
                            setAnnouncement('Evidence inspector showing ' + room.name + '.');
                          }}>{room.name}</button>
                          {room.location && <span className="room-location">{room.location}</span>}
                          <span className="room-location">{room.seats ? <><span className="numeric">{room.seats.value}</span> seats</> : 'Seats unverified'}</span>
                        </th>
                        <td className="route-summary">{routeLabel(room, result)}</td>
                        {before && <td className="previous-status"><span className={'status ' + before.status}>{resultLabels[before.status]}</span></td>}
                        <td>
                          <span className={'status ' + result.status}>{resultLabels[result.status]}</span>
                          {before && <span className="mobile-baseline">Baseline · {resultLabels[before.status]}</span>}
                          {changed && <span className="outcome-change">Changed</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : !roomEditor && <p className="empty-inspector">Add a replacement room and enter the observations you can verify.</p>}
            {selectedRoom && <a className="evidence-link" href="#room-evidence">View selected room evidence</a>}
          </section>
          <EvidenceInspector room={selectedRoom} availability={inputs.availability} evaluation={selection?.evaluation} onEdit={() => {
            if (!selectedRoom) return;
            const focused = document.activeElement;
            editorTrigger.current = focused instanceof HTMLButtonElement ? focused : null;
            setRoomEditor({ room: selectedRoom });
          }} />
        </div>
      </main>
      <div className="sr-only" role="status">{announcement}</div>
    </>
  );
}
