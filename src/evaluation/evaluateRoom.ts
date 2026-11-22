import type { RouteAvailability, RoomFacts } from '../roomFacts';
import type { EvaluateRoom, RequirementEvidence } from './contract';

function checkCapacity(seats: RoomFacts['seats'], attendees: number): RequirementEvidence {
  if (!seats) {
    return {
      requirement: 'capacity', status: 'unverified',
      explanation: 'Obtain a room capacity record to verify the seat count.', observationIds: [],
    };
  }

  return {
    requirement: 'capacity', status: seats.value >= attendees ? 'met' : 'unmet',
    explanation: `Verified room capacity is ${seats.value}. The event needs ${attendees} seats.`,
    observationIds: [seats.id],
  };
}

function checkProjector(projector: RoomFacts['projector']): RequirementEvidence {
  if (!projector) {
    return {
      requirement: 'projector', status: 'unverified',
      explanation: 'Confirm projector availability with the venue.', observationIds: [],
    };
  }

  return {
    requirement: 'projector', status: projector.value ? 'met' : 'unmet',
    explanation: projector.value ? 'The room record confirms a projector.' : 'The room record confirms there is no projector.',
    observationIds: [projector.id],
  };
}

function checkStepFreeRoute(survey: RoomFacts['stepFreeRoutes'], availability: RouteAvailability): RequirementEvidence {
  if (!survey) {
    return {
      requirement: 'step-free', status: 'unverified',
      explanation: 'Obtain an access survey to verify a step-free route.', observationIds: [],
    };
  }

  const supportingIds = new Set([survey.id]);
  const routesMissingReports = new Set<string>();

  for (const route of survey.value) {
    if (route.elevatorId === null) {
      return {
        requirement: 'step-free', status: 'met',
        explanation: `The survey confirms a direct step-free route. ${route.label}.`,
        observationIds: [survey.id],
      };
    }

    const report = availability[route.elevatorId];
    if (!report) {
      routesMissingReports.add(route.label);
      continue;
    }

    if (report.value === 'available') {
      return {
        requirement: 'step-free', status: 'met',
        explanation: `${route.label}. Its lift is reported available.`,
        observationIds: [...new Set([survey.id, report.id])],
      };
    }

    supportingIds.add(report.id);
  }

  if (routesMissingReports.size > 0) {
    return {
      requirement: 'step-free', status: 'unverified',
      explanation: `Obtain current lift service reports for these surveyed routes. ${[...routesMissingReports].join(' · ')}.`,
      observationIds: [...supportingIds],
    };
  }

  return {
    requirement: 'step-free', status: 'unmet',
    explanation: survey.value.length
      ? 'Every surveyed step-free route depends on a lift reported out of service.'
      : 'The survey confirms there is no step-free route.',
    observationIds: [...supportingIds],
  };
}

export const evaluateRoom: EvaluateRoom = (room, requirements, availability) => {
  const evidence = [checkCapacity(room.seats, requirements.attendees)];
  if (requirements.stepFree) evidence.push(checkStepFreeRoute(room.stepFreeRoutes, availability));
  if (requirements.projector) evidence.push(checkProjector(room.projector));

  if (evidence.some(check => check.status === 'unmet')) return { status: 'ineligible', evidence };
  if (evidence.some(check => check.status === 'unverified')) return { status: 'unverified', evidence };
  return { status: 'qualifies', evidence };
};
