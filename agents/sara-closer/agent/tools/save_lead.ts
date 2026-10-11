import { defineTool } from "eve/tools";
import { z } from "zod";
import { upsertLead } from "@/lib/store";

export default defineTool({
  description:
    "Create or update a lead in the CRM with what the customer has told you: name, phone, language, interest, budget, location, stage and notes. Call it whenever you learn a new qualifying detail.",
  inputSchema: z.object({
    leadId: z.string().min(1).describe("Stable id for this customer in this conversation"),
    name: z.string().optional(),
    phone: z.string().optional(),
    language: z.string().optional(),
    interest: z.enum(["buy", "rent", "car", "unknown"]).optional(),
    budget: z.string().optional(),
    location: z.string().optional(),
    stage: z.enum(["new", "qualified", "hot", "lost"]).optional(),
    note: z.string().optional().describe("A short note to add to the lead's history"),
  }),
  async execute({ leadId, note, ...fields }) {
    const lead = upsertLead(leadId, { ...fields, notes: note ? [note] : undefined });
    return { ok: true, stage: lead.stage, updatedAt: lead.updatedAt };
  },
});
