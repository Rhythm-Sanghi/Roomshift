import type { RoomEvaluation } from '../src/evaluation/contract';
import { example, exampleElevator, exampleServiceReport, exampleWestElevator, exampleWestServiceReport } from '../src/example';
import type { EventRequirements, RoomFacts, RouteAvailability } from '../src/roomFacts';

type EvaluationCase = Readonly<{
  name: string;
  input: readonly [room: RoomFacts, requirements: EventRequirements, availability: RouteAvailability];
  expected: RoomEvaluation;
  survivingRoute?: string;
}>;

function exampleRoom(id: string) {
  const room = example.rooms.find(candidate => candidate.id === id);
  if (!room) throw new Error('Missing example room: ' + id);
  return room;
}

const forum = exampleRoom('forum');
const commons = exampleRoom('commons');
const annex = exampleRoom('forum-annex');
const northLiftOutage: RouteAvailability = {
  [exampleElevator.id]: { ...exampleServiceReport, value: 'out-of-service' },
};
const westLiftFallback: RouteAvailability = {
  ...example.availability,
  ...northLiftOutage,
};
const annexCapacity = {
  requirement: 'capacity', status: 'met', observationIds: ['annex-seats'],
  explanation: '42 verified seats for 30 attendees.',
} as const;
const annexProjector = {
  requirement: 'projector', status: 'met', observationIds: ['annex-projector'],
  explanation: 'The AV checklist confirms a projector.',
} as const;
const annexWestRoute = {
  requirement: 'step-free', status: 'met', observationIds: ['annex-route-survey', 'west-lift-status'],
  explanation: 'The verified West entrance route uses the available West lift.',
} as const;
const customRoom: RoomFacts = {
  id: 'workshop-12',
  name: 'Workshop 12',
  location: 'East Hall',
  seats: { id: 'workshop-seats', source: 'Organizer room inventory', value: 18 },
  projector: null,
  stepFreeRoutes: {
    id: 'workshop-route',
    source: 'Organizer walk-through',
    value: [{ label: 'Level entry through east doors', elevatorId: null }],
  },
};

const forumCapacity = {
  requirement: 'capacity', status: 'met', observationIds: ['forum-seats'],
  explanation: '42 verified seats for 30 attendees.',
} as const;
const forumProjector = {
  requirement: 'projector', status: 'met', observationIds: ['forum-projector'],
  explanation: 'The AV checklist confirms a projector.',
} as const;

export const evaluationCases: readonly EvaluationCase[] = [
  {
    name: 'Forum Annex is ineligible when both surveyed lifts are out of service',
    input: [annex, example.requirements, {
      ...northLiftOutage,
      [exampleWestElevator.id]: { ...exampleWestServiceReport, value: 'out-of-service' },
    }],
    expected: {
      status: 'ineligible',
      evidence: [
        annexCapacity,
        {
          requirement: 'step-free', status: 'unmet', observationIds: ['annex-route-survey', 'north-lift-status', 'west-lift-status'],
          explanation: 'Both surveyed routes depend on lifts that are out of service.',
        },
        annexProjector,
      ],
    },
  },
  {
    name: 'Forum 204 qualifies while the North lift is available',
    input: [forum, example.requirements, example.availability],
    expected: {
      status: 'qualifies',
      evidence: [
        forumCapacity,
        {
          requirement: 'step-free', status: 'met', observationIds: ['forum-route', 'north-lift-status'],
          explanation: 'The verified North entrance route uses the available North lift.',
        },
        forumProjector,
      ],
    },
  },
  {
    name: 'Forum 204 is ineligible when its only verified route closes',
    input: [forum, example.requirements, northLiftOutage],
    expected: {
      status: 'ineligible',
      evidence: [
        forumCapacity,
        {
          requirement: 'step-free', status: 'unmet', observationIds: ['forum-route', 'north-lift-status'],
          explanation: 'The North lift is out of service and serves the only verified step-free route.',
        },
        forumProjector,
      ],
    },
  },
  {
    name: 'Forum Annex qualifies during the North lift outage and cites the remaining route',
    input: [annex, example.requirements, westLiftFallback],
    expected: {
      status: 'qualifies',
      evidence: [
        annexCapacity,
        annexWestRoute,
        annexProjector,
      ],
    },
    survivingRoute: 'West lift',
  },
  {
    name: 'Increasing attendance to 45 makes Forum Annex ineligible despite its usable West lift route',
    input: [annex, { ...example.requirements, attendees: 45 }, westLiftFallback],
    expected: {
      status: 'ineligible',
      evidence: [
        {
          requirement: 'capacity', status: 'unmet', observationIds: ['annex-seats'],
          explanation: '42 verified seats for 45 attendees.',
        },
        annexWestRoute,
        annexProjector,
      ],
    },
    survivingRoute: 'West lift',
  },
  {
    name: 'Forum Annex stays unverified when the North lift is out and West lift service is missing',
    input: [annex, example.requirements, northLiftOutage],
    expected: {
      status: 'unverified',
      evidence: [
        annexCapacity,
        {
          requirement: 'step-free', status: 'unverified', observationIds: ['annex-route-survey', 'north-lift-status'],
          explanation: 'The North lift is out of service, and there is no service report for the West lift.',
        },
        annexProjector,
      ],
    },
  },
  {
    name: 'Commons 106 stays unverified when the route observation is missing',
    input: [commons, example.requirements, example.availability],
    expected: {
      status: 'unverified',
      evidence: [
        {
          requirement: 'capacity', status: 'met', observationIds: ['commons-seats'],
          explanation: '36 verified seats for 30 attendees.',
        },
        {
          requirement: 'step-free', status: 'unverified', observationIds: [],
          explanation: 'There is no recorded observation for a step-free route.',
        },
        {
          requirement: 'projector', status: 'met', observationIds: ['commons-projector'],
          explanation: 'The AV checklist confirms a projector.',
        },
      ],
    },
  },
  {
    name: 'Verified capacity failure makes Commons 106 ineligible while its route remains unverified',
    input: [commons, { ...example.requirements, attendees: 45 }, westLiftFallback],
    expected: {
      status: 'ineligible',
      evidence: [
        {
          requirement: 'capacity', status: 'unmet', observationIds: ['commons-seats'],
          explanation: '36 verified seats for 45 attendees.',
        },
        {
          requirement: 'step-free', status: 'unverified', observationIds: [],
          explanation: 'There is no recorded observation for a step-free route.',
        },
        {
          requirement: 'projector', status: 'met', observationIds: ['commons-projector'],
          explanation: 'The AV checklist confirms a projector.',
        },
      ],
    },
  },
  {
    name: 'A custom room with too few seats is ineligible despite a verified direct route',
    input: [customRoom, { attendees: 30, stepFree: true, projector: false }, {}],
    expected: {
      status: 'ineligible',
      evidence: [
        {
          requirement: 'capacity', status: 'unmet', observationIds: ['workshop-seats'],
          explanation: '18 verified seats for 30 attendees.',
        },
        {
          requirement: 'step-free', status: 'met', observationIds: ['workshop-route'],
          explanation: 'The walk-through confirms level entry through the east doors.',
        },
      ],
    },
  },
  {
    name: 'A custom room at exact capacity qualifies with the projector requirement disabled',
    input: [
      { ...customRoom, seats: { id: 'workshop-seats', source: 'Organizer room inventory', value: 30 } },
      { attendees: 30, stepFree: true, projector: false },
      {},
    ],
    expected: {
      status: 'qualifies',
      evidence: [
        {
          requirement: 'capacity', status: 'met', observationIds: ['workshop-seats'],
          explanation: '30 verified seats for 30 attendees.',
        },
        {
          requirement: 'step-free', status: 'met', observationIds: ['workshop-route'],
          explanation: 'The walk-through confirms level entry through the east doors.',
        },
      ],
    },
  },
  {
    name: 'A survey that confirms no step-free route is a verified failure',
    input: [
      { ...forum, stepFreeRoutes: { id: 'no-route-survey', source: 'Fictional access survey', value: [] } },
      example.requirements,
      example.availability,
    ],
    expected: {
      status: 'ineligible',
      evidence: [
        forumCapacity,
        { requirement: 'step-free', status: 'unmet', observationIds: ['no-route-survey'], explanation: 'The survey confirms there is no step-free route.' },
        forumProjector,
      ],
    },
  },
  {
    name: 'Two closed routes using the same lift cite its report once',
    input: [
      {
        ...forum,
        stepFreeRoutes: {
          id: 'shared-lift-survey',
          source: 'Fictional access survey',
          value: [
            { label: 'North entrance via North lift', elevatorId: exampleElevator.id },
            { label: 'Courtyard entrance via North lift', elevatorId: exampleElevator.id },
          ],
        },
      },
      example.requirements,
      northLiftOutage,
    ],
    expected: {
      status: 'ineligible',
      evidence: [
        forumCapacity,
        { requirement: 'step-free', status: 'unmet', observationIds: ['shared-lift-survey', 'north-lift-status'], explanation: 'Both routes require the closed North lift.' },
        forumProjector,
      ],
    },
  },
];
