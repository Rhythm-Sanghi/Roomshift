export type Observation<T> = Readonly<{
  id: string;
  value: T;
  source: string;
}>;

export type StepFreeRoute = Readonly<{
  label: string;
  elevatorId: string | null;
}>;

export type RoomFacts = Readonly<{
  id: string;
  name: string;
  location: string;
  seats: Observation<number> | null;
  projector: Observation<boolean> | null;
  // null means no evidence. An observed empty list confirms there is no route.
  stepFreeRoutes: Observation<readonly StepFreeRoute[]> | null;
}>;

export type EventRequirements = Readonly<{
  attendees: number;
  stepFree: boolean;
  projector: boolean;
}>;

export type ServiceStatus = 'available' | 'out-of-service';
export type RouteAvailability = Readonly<
  Record<string, Observation<ServiceStatus> | undefined>
>;

export type RoomInputs = Readonly<{
  requirements: EventRequirements;
  rooms: readonly RoomFacts[];
  availability: RouteAvailability;
}>;
