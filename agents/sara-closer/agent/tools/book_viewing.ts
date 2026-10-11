import { defineTool } from "eve/tools";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";
import { signBooking } from "@/lib/booking-token";
import { addBooking, bookingsAt, getLead, upsertLead } from "@/lib/store";

export default defineTool({
  description:
    "Request a property viewing or car test drive for a lead at a slot returned by check_availability. Requires the lead's phone number. The booking is pending until a PropAuto advisor confirms it from the email sent to the team; tell the customer it is pending, not confirmed.",
  inputSchema: z.object({
    leadId: z.string().min(1),
    kind: z.enum(["viewing", "test_drive"]),
    startsAt: z.string().describe("ISO timestamp of a slot from check_availability"),
    listingRef: z.string().min(1).describe("Property or car reference the customer chose"),
  }),
  label: {
    start: ({ kind, startsAt }) => `Request ${kind === "viewing" ? "viewing" : "test drive"} at ${startsAt}`,
  },
  async execute({ leadId, kind, startsAt, listingRef }) {
    const lead = getLead(leadId);
    if (!lead?.phone) {
      return { ok: false, error: "Phone number is required before booking. Ask the customer for it." };
    }
    if (bookingsAt(startsAt).length > 0) {
      return { ok: false, error: "That slot was just taken. Check availability and offer another." };
    }

    const notifyTo = process.env.BOOKING_NOTIFY_EMAIL;
    const publicUrl = process.env.PUBLIC_APP_URL;
    if (!notifyTo || !publicUrl) {
      return { ok: false, error: "Booking requests are not configured yet. Tell the customer an advisor will call them." };
    }

    const id = `bk_${crypto.randomUUID()}`;
    const confirmUrl = `${publicUrl}/api/bookings/${id}/confirm?token=${signBooking(id)}`;
    const sent = await sendEmail(
      notifyTo,
      `Confirm ${kind === "viewing" ? "viewing" : "test drive"}: ${listingRef}`,
      [
        `Customer phone: ${lead.phone}`,
        `Name: ${lead.name ?? "not given"}`,
        `Interest: ${lead.interest}${lead.budget ? `, budget ${lead.budget}` : ""}${lead.location ? `, location ${lead.location}` : ""}`,
        `Requested: ${kind} for ${listingRef} at ${startsAt}`,
        "",
        `Confirm this booking: ${confirmUrl}`,
      ].join("\n"),
    );
    if (!sent.ok) {
      // No booking is stored when the request could not be sent, so nothing is held without an advisor seeing it.
      return { ok: false, error: `Could not send the confirmation request (${sent.error}). Offer another time or ask the customer to wait for a call.` };
    }

    addBooking({ id, leadId, kind, startsAt, listingRef, status: "pending" });
    upsertLead(leadId, { stage: "hot", notes: [`Requested ${kind} for ${startsAt} (${listingRef}), awaiting confirmation`] });
    return { ok: true, status: "pending", bookingId: id, startsAt, kind, listingRef };
  },
});
