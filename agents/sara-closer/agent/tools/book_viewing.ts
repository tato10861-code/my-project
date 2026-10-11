import { defineTool } from "eve/tools";
import { z } from "zod";
import { addBooking, bookingsAt, getLead, upsertLead } from "@/lib/store";

export default defineTool({
  description:
    "Book a property viewing or car test drive for a lead at a slot returned by check_availability. Requires the lead's phone number. Returns the confirmation.",
  inputSchema: z.object({
    leadId: z.string().min(1),
    kind: z.enum(["viewing", "test_drive"]),
    startsAt: z.string().describe("ISO timestamp of a slot from check_availability"),
    listingRef: z.string().min(1).describe("Property or car reference the customer chose"),
  }),
  label: {
    start: ({ kind, startsAt }) => `Book ${kind === "viewing" ? "viewing" : "test drive"} at ${startsAt}`,
  },
  async execute({ leadId, kind, startsAt, listingRef }) {
    const lead = getLead(leadId);
    if (!lead?.phone) {
      return { ok: false, error: "Phone number is required before booking. Ask the customer for it." };
    }
    if (bookingsAt(startsAt).length > 0) {
      return { ok: false, error: "That slot was just taken. Check availability and offer another." };
    }
    const booking = addBooking({
      id: `bk_${crypto.randomUUID()}`,
      leadId,
      kind,
      startsAt,
      listingRef,
      status: "confirmed",
    });
    upsertLead(leadId, { stage: "booked", notes: [`Booked ${kind} for ${startsAt} (${listingRef})`] });
    return { ok: true, bookingId: booking.id, startsAt, kind, listingRef };
  },
});
