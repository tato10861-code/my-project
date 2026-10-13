// In-process store for Sara's leads and viewing bookings.
// Serverless instances do not share memory and reset on cold start, so this
// is a stand-in until a database is connected behind these same functions.

export type Lead = {
  id: string;
  name?: string;
  phone?: string;
  language?: string;
  interest: "buy" | "rent" | "car" | "unknown";
  budget?: string;
  location?: string;
  stage: "new" | "qualified" | "hot" | "booked" | "lost";
  notes: string[];
  updatedAt: string;
};

export type Booking = {
  id: string;
  leadId: string;
  kind: "viewing" | "test_drive";
  startsAt: string;
  listingRef: string;
  // pending: waiting for the advisor's confirmation from the email link.
  status: "pending" | "confirmed" | "cancelled";
};

const leads = new Map<string, Lead>();
const bookings = new Map<string, Booking>();

export function upsertLead(id: string, patch: Partial<Omit<Lead, "id" | "updatedAt">>): Lead {
  const current = leads.get(id) ?? {
    id,
    interest: "unknown" as const,
    stage: "new" as const,
    notes: [],
    updatedAt: "",
  };
  const next: Lead = {
    ...current,
    ...patch,
    notes: patch.notes ? [...current.notes, ...patch.notes] : current.notes,
    updatedAt: new Date().toISOString(),
  };
  leads.set(id, next);
  return next;
}

export function getLead(id: string): Lead | undefined {
  return leads.get(id);
}

export function addBooking(booking: Booking): Booking {
  bookings.set(booking.id, booking);
  return booking;
}

export function getBooking(id: string): Booking | undefined {
  return bookings.get(id);
}

export function setBookingStatus(id: string, status: Booking["status"]): Booking | undefined {
  const booking = bookings.get(id);
  if (!booking) return undefined;
  const next = { ...booking, status };
  bookings.set(id, next);
  return next;
}

// A slot is taken while a booking is pending or confirmed.
export function bookingsAt(startsAt: string): Booking[] {
  return [...bookings.values()].filter(
    (b) => b.startsAt === startsAt && (b.status === "pending" || b.status === "confirmed"),
  );
}
