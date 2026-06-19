import { NextResponse } from 'next/server';
import { TicketService } from '@/services/ticketService'; // Check if your filename is ticket.ts or ticketService.ts
import { Ticket } from '@/types/ticket';

// --- READ (Check if Backend is working) ---
export async function GET() {

  
  try {
    // This fetches all tickets dynamically from CouchDB
    const result = await TicketService.getAllTickets(); 
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Database connection error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// --- CREATE (The Dynamic Write) ---
export async function POST(request: Request) {
  try {
    // 1. We type the incoming body as 'Ticket' for TS safety
    const body: Ticket = await request.json();

    // 2. The Messenger (Service) delivers it to Docker
    const result = await TicketService.createTicket(body);

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}