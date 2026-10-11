import { defineTool } from "eve/tools";
import { z } from "zod";
import { bookingsAt } from "@/lib/store";

// Working hours for viewings and test drives, in 24h local time.
const SLOT_HOURS = [10, 12, 15, 17];

export default defineTool({
  description:
    "List the free viewing or test-drive slots for the next few days. Call this before offering a time to the customer.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(7).default(3),
    from: z.string().optional().describe("ISO date to start from; defaults to today"),
  }),
  async execute({ days, from }) {
    const start = from ? new Date(from) : new Date();
    const slots: string[] = [];
    for (let d = 0; d < days; d++) {
      for (const hour of SLOT_HOURS) {
        const slot = new Date(start);
        slot.setDate(start.getDate() + d);
        slot.setHours(hour, 0, 0, 0);
        if (slot.getTime() <= Date.now()) continue;
        const iso = slot.toISOString();
        if (bookingsAt(iso).length === 0) slots.push(iso);
      }
    }
    return { slots };
  },
});
