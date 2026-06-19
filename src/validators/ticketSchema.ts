import { z } from "zod";

export const ticketSchema = z.object({
  subject: z.string().min(3, "Subject kam se kam 3 characters ka hona chahiye"),
  description: z.string().min(5, "Description thoda bada likhein"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["open", "in-progress", "closed"]).default("open"),
});

// Agar aapko TypeScript type bhi chahiye toh:
export type TicketSchemaType = z.infer<typeof ticketSchema>;