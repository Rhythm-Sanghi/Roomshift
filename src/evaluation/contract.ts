import type { EventRequirements, RoomFacts, RouteAvailability } from '../roomFacts';

export type RequirementId = 'capacity' | 'step-free' | 'projector';
export type RequirementStatus = 'met' | 'unmet' | 'unverified';
export type RoomStatus = 'qualifies' | 'ineligible' | 'unverified';

export type RequirementEvidence = Readonly<{
  requirement: RequirementId;
  status: RequirementStatus;
  explanation: string;
  observationIds: readonly string[];
}>;

export type RoomEvaluation = Readonly<{
  status: RoomStatus;
  evidence: readonly RequirementEvidence[];
}>;

/**
 * Evaluate the active requirements, returning one evidence item per requirement.
 * Cite input observation IDs for facts used. Explain missing observations in words.
 * A required check with missing evidence cannot be marked met.
 * The same inputs must produce the same output.
 */
export type EvaluateRoom = (
  room: RoomFacts,
  requirements: EventRequirements,
  availability: RouteAvailability,
) => RoomEvaluation;
