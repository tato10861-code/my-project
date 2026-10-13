import { verifyBookingToken } from "@/lib/booking-token";
import { getBooking, setBookingStatus } from "@/lib/store";

// The advisor opens the link from the notification email. Only a valid token
// (HMAC of the booking id) can confirm, so the link is the authorization.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!verifyBookingToken(id, token)) {
    return new Response("Invalid confirmation link.", { status: 403 });
  }
  const booking = getBooking(id);
  if (!booking) {
    return new Response("Booking not found. It may have expired after a server restart.", { status: 404 });
  }
  if (booking.status === "pending") setBookingStatus(id, "confirmed");

  const current = getBooking(id);
  return new Response(`Booking ${id} is ${current?.status}.`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
