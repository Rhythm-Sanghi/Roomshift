import type { Observation, RoomInputs, ServiceStatus } from './roomFacts';

export const exampleElevator = {
  id: 'north-lift',
  label: 'North lift',
};

export const exampleServiceReport: Observation<ServiceStatus> = {
  id: 'north-lift-status',
  value: 'available',
  source: 'Fictional facilities bulletin',
};

export const exampleWestElevator = { id: 'west-lift', label: 'West lift' };
export const exampleWestServiceReport: Observation<ServiceStatus> = {
  id: 'west-lift-status',
  value: 'available',
  source: 'Fictional West lift service report',
};

export const example: RoomInputs = {
  requirements: { attendees: 30, stepFree: true, projector: true },
  rooms: [
    {
      id: 'forum',
      name: 'Forum 204',
      location: 'North Hall · Level 2',
      seats: { id: 'forum-seats', value: 42, source: 'Fictional room inventory' },
      projector: { id: 'forum-projector', value: true, source: 'Fictional AV checklist' },
      stepFreeRoutes: {
        id: 'forum-route',
        value: [{ label: 'North entrance via North lift', elevatorId: exampleElevator.id }],
        source: 'Fictional access survey',
      },
    },
    {
      id: 'forum-annex',
      name: 'Forum Annex',
      location: 'North Hall · Level 2',
      seats: { id: 'annex-seats', value: 42, source: 'Fictional annex room inventory' },
      projector: { id: 'annex-projector', value: true, source: 'Fictional annex AV checklist' },
      stepFreeRoutes: {
        id: 'annex-route-survey',
        value: [
          { label: 'North entrance via North lift', elevatorId: exampleElevator.id },
          { label: 'West entrance via West lift', elevatorId: exampleWestElevator.id },
        ],
        source: 'Fictional annex access survey',
      },
    },
    {
      id: 'commons',
      name: 'Commons 106',
      location: 'Student Center · Ground floor',
      seats: { id: 'commons-seats', value: 36, source: 'Fictional room inventory' },
      projector: { id: 'commons-projector', value: true, source: 'Fictional AV checklist' },
      stepFreeRoutes: null,
    },
  ],
  availability: {
    [exampleElevator.id]: exampleServiceReport,
    [exampleWestElevator.id]: exampleWestServiceReport,
  },
};

export const blankInputs: RoomInputs = {
  requirements: { attendees: 30, stepFree: true, projector: false },
  rooms: [],
  availability: {},
};
