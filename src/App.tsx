import { useRef, useState, type FormEvent } from 'react';
import { EvidenceInspector, serviceLabel } from './EvidenceInspector';
import { RoomForm } from './RoomForm';
import { blankInputs, example, exampleElevator, exampleWestElevator } from './example';
import { evaluateRoom } from './evaluation/evaluateRoom';
import type { RoomEvaluation, RoomStatus } from './evaluation/contract';
import type { EventRequirements, RoomFacts, RoomInputs, RouteAvailability, ServiceStatus } from './roomFacts';

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

function citedExampleLift(result: RoomEvaluation, availability: RouteAvailability) {
  const routeCheck = result.evidence.find(check => check.requirement === 'step-free' && check.status === 'met');
  if (!routeCheck) return undefined;

  return exampleElevators.find(({ id }) => {
    const report = availability[id];
    return report?.value === 'available' && routeCheck.observationIds.includes(report.id);
  });
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
  const [exampleMode, setExampleMode] = useState(true);
  const [exampleRevision, setExampleRevision] = useState(0);
  const [resetAnnouncement, setResetAnnouncement] = useState('');
  const resetDialog = useRef<HTMLDialogElement>(null);

  function resetExample() {
    resetDialog.current?.close();
    setExampleRevision(revision => revision + 1);
    setResetAnnouncement('Fictional example reset.');
  }

  return (
    <>
      <a className="skip-link" href={exampleMode ? '#workspace' : '#custom-workspace'}>Skip to workspace</a>
      <header className="app-header">
        <div className="header-inner">
          <strong className="brand"><span className="brand-mark" aria-hidden="true" />Roomshift</strong>
          <div className="actions" role="group" aria-label="Workspace">
            <button className={exampleMode ? 'primary' : undefined} aria-pressed={exampleMode} onClick={() => setExampleMode(true)}>View example</button>
            <button className={exampleMode ? undefined : 'primary'} aria-pressed={!exampleMode} onClick={() => setExampleMode(false)}>Use my rooms</button>
            {exampleMode && <button onClick={() => resetDialog.current?.showModal()}>Reset example</button>}
          </div>
        </div>
      </header>
      <dialog ref={resetDialog} className="reset-dialog" aria-labelledby="reset-dialog-title">
        <h2 id="reset-dialog-title">Reset the fictional example?</h2>
        <p>This discards edits to the example. Your custom rooms and drafts stay available.</p>
        <form method="dialog" className="actions">
          <button autoFocus>Keep edits</button>
          <button type="button" onClick={resetExample}>Reset fictional example</button>
        </form>
      </dialog>
      <Workspace key={exampleRevision} exampleMode active={exampleMode} />
      <Workspace exampleMode={false} active={!exampleMode} />
      <div className="sr-only" role="status">{resetAnnouncement}</div>
    </>
  );
}

// Keep both workspaces mounted so switching also preserves unfinished form edits.
function Workspace({ exampleMode, active }: { exampleMode: boolean; active: boolean }) {
  const initialInputs = exampleMode ? example : blankInputs;
  const workspaceId = exampleMode ? 'workspace' : 'custom-workspace';
  const evidenceId = exampleMode ? 'room-evidence' : 'custom-room-evidence';
  const eventHeadingId = workspaceId + '-event';
  const comparisonHeadingId = workspaceId + '-comparison';
  const baselineId = workspaceId + '-baseline';
  const [inputs, setInputs] = useState<RoomInputs>(initialInputs);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(initialInputs.rooms[0]?.id);
  const [roomEditor, setRoomEditor] = useState<{ room: RoomFacts | null } | null>(exampleMode ? null : { room: null });
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
    inputs.availability[candidate.id]?.id !== example.availability[candidate.id]?.id,
  );

  function updateRequirements(requirements: EventRequirements) {
    setInputs(current => ({ ...current, requirements }));
    setAnnouncement('Event requirements applied.');
  }

  function updateService(changedElevator: { id: string; label: string }, value: ServiceStatus | '') {
    const { id, label } = changedElevator;
    const nextInputs = {
      ...inputs,
      availability: {
        ...inputs.availability,
        [id]: value ? {
          id: exampleMode ? id + '-scenario-override' : id + '-organizer-report',
          source: exampleMode ? 'Organizer scenario override' : 'Organizer service report',
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
      <main id={workspaceId} tabIndex={-1} hidden={!active}>
        <div className="page-heading">
          <h1>Compare replacement rooms</h1>
          <p>Check room evidence against what your event needs.</p>
        </div>

        <section className="event-panel" aria-labelledby={eventHeadingId}>
          <div className="section-bar"><h2 id={eventHeadingId}>Event requirements</h2></div>
          <RequirementsForm requirements={inputs.requirements} onSave={updateRequirements} />
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
                {service && <span className="source">Source · {service.source}</span>}
                {original && service?.id !== original.id && (
                  <span className="change-note"><strong>Baseline</strong> · {serviceLabel(original.value)} · {original.source}</span>
                )}
              </div>
            );
          })}
        </section>

        <div className="workspace-notice">
          <strong>{exampleMode ? 'Fictional example' : 'Custom input'}</strong>
          <p>{exampleMode
            ? 'Set the North lift out of service, then select a room to inspect the evidence behind its result.'
            : 'Room drafts stay here when you switch workspaces and clear when you reload the page.'}</p>
        </div>

        <div className="workspace-grid">
          <section className="comparison" aria-labelledby={comparisonHeadingId}>
            <div className="section-bar">
              <h2 id={comparisonHeadingId}>Room comparison</h2>
              <button ref={addRoomButton} onClick={event => { editorTrigger.current = event.currentTarget; setRoomEditor({ room: null }); }}>Add room</button>
            </div>
            {roomEditor && <RoomForm key={roomEditor.room?.id ?? 'new'} room={roomEditor.room} elevator={elevator} onSave={saveRoom} onCancel={closeEditor} />}
            <NoQualifyingRooms results={evaluatedRooms.map(({ evaluation }) => evaluation)} />
            {serviceChanged && <p id={baselineId} className="comparison-note muted">The baseline uses the original lift reports with the current room facts and event requirements.</p>}
            {inputs.rooms.length > 0 ? (
              <table className={serviceChanged ? 'before-and-after' : undefined} aria-describedby={serviceChanged ? baselineId : undefined}>
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
                    const beforeLift = before?.status === 'qualifies' && result.status === 'qualifies'
                      ? citedExampleLift(before, example.availability)
                      : undefined;
                    const currentLift = beforeLift && citedExampleLift(result, inputs.availability);
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
                        <td className="route-summary">
                          {routeLabel(room, result)}
                          {beforeLift && currentLift && beforeLift.id !== currentLift.id && (
                            <span className="outcome-change">Route changed · {beforeLift.label} → {currentLift.label}</span>
                          )}
                        </td>
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
            {selectedRoom && <a className="evidence-link" href={'#' + evidenceId}>View selected room evidence</a>}
          </section>
          <EvidenceInspector id={evidenceId} room={selectedRoom} availability={inputs.availability} evaluation={selection?.evaluation} onEdit={() => {
            if (!selectedRoom) return;
            const focused = document.activeElement;
            editorTrigger.current = focused instanceof HTMLButtonElement ? focused : null;
            setRoomEditor({ room: selectedRoom });
          }} />
        </div>
        <div className="sr-only" role="status">{announcement}</div>
      </main>
  );
}
