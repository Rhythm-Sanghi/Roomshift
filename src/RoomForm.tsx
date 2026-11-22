import { useState, type FormEvent } from 'react';
import type { Observation, RoomFacts, StepFreeRoute } from './roomFacts';

type RouteChoice = 'unverified' | 'none' | 'direct' | 'elevator';

function routeChoice(routes: RoomFacts['stepFreeRoutes']): RouteChoice {
  if (!routes) return 'unverified';
  if (!routes.value.length) return 'none';
  return routes.value.some(route => route.elevatorId === null) ? 'direct' : 'elevator';
}

type RoomFormProps = {
  room: RoomFacts | null;
  elevator: { id: string; label: string };
  onSave: (room: RoomFacts) => void;
  onCancel: () => void;
};

export function RoomForm({ room, elevator, onSave, onCancel }: RoomFormProps) {
  const [error, setError] = useState('');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name')).trim();
    const location = String(fields.get('location')).trim();
    const seatText = String(fields.get('seats')).trim();
    const seats = seatText === '' ? null : Number(seatText);
    const projector = fields.get('projector');
    const route = fields.get('route');
    const enteredSource = String(fields.get('source')).trim();

    if (!name || (seats !== null && (!Number.isSafeInteger(seats) || seats < 1))) {
      setError('Enter a room name and use a positive whole number for verified seats.');
      return;
    }

    const id = room?.id ?? crypto.randomUUID();
    const source = enteredSource || 'Organizer entry';
    const projectorValue = projector === '' ? null : projector === 'yes';
    const routeValue: readonly StepFreeRoute[] = route === 'elevator'
      ? [{ label: 'Step-free route via ' + elevator.label, elevatorId: elevator.id }]
      : route === 'direct'
        ? [{ label: 'Step-free entrance', elevatorId: null }]
        : [];
    const routes = route === routeChoice(room?.stepFreeRoutes ?? null)
      ? (room?.stepFreeRoutes?.value ?? routeValue)
      : routeValue;

    function observation<T>(suffix: string, value: T | null, previous?: Observation<T> | null) {
      if (value === null) return null;
      if (!enteredSource && previous?.value === value) return previous;
      return { id: id + '-' + suffix, value, source };
    }

    onSave({
      id,
      name,
      location,
      seats: observation('seats', seats, room?.seats),
      projector: observation('projector', projectorValue, room?.projector),
      stepFreeRoutes: observation('route', route === 'unverified' ? null : routes, room?.stepFreeRoutes),
    });
  }

  return (
    <form className="room-form" onSubmit={save} aria-labelledby="room-form-title">
      <h3 id="room-form-title">{room ? 'Edit room' : 'Add a room'}</h3>
      <div className="room-fields">
        <label>Room name<input name="name" autoFocus defaultValue={room?.name} required maxLength={80} /></label>
        <label>Location<input name="location" defaultValue={room?.location} maxLength={120} /></label>
        <label>Verified seats<input name="seats" type="number" min="1" step="1" placeholder="Unverified" defaultValue={room?.seats?.value} /></label>
        <label>Projector
          <select name="projector" defaultValue={room?.projector ? (room.projector.value ? 'yes' : 'no') : ''}>
            <option value="">Unverified</option>
            <option value="yes">Verified present</option>
            <option value="no">Verified absent</option>
          </select>
        </label>
        <label>Step-free route
          <select name="route" defaultValue={routeChoice(room?.stepFreeRoutes ?? null)}>
            <option value="unverified">Unverified</option>
            <option value="none">Verified no route</option>
            <option value="direct">Verified direct route</option>
            <option value="elevator">Verified route via {elevator.label}</option>
          </select>
        </label>
        <label><span>Source for observations <span className="optional">(optional)</span></span>
          <input name="source" placeholder="e.g. Facilities room inventory" maxLength={120} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions"><button type="submit" className="primary">Save room</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
