import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { Counter } from '../model/counter.model.js';
import { Ticket } from '../model/ticket.model.js';

// generate Sequential ID based on session
const generateTicketId = async (session: "SESSION_1" | "SESSION_2"): Promise<string> => {
  // 81 for session 1 and 82 for 2nd
  const counterKey = session === "SESSION_1" ? 'ticket_sequence_81' : 'ticket_sequence_82';
  const sessionCode = session === "SESSION_1" ? "81" : "82";
 
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true } 
  );

  // pad the number with zeroes (1 becomes 0001)
  const sequenceStr = counter.sequence.toString().padStart(4, '0');
  return `TEDXIITP-26-${sessionCode}-${sequenceStr}`;
};

// generate and save the QR Code
export const generateTicketAndQR = async (userId: string, session: "SESSION_1" | "SESSION_2") => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing from .env");

  
  const ticketId = await generateTicketId(session);

  const payload = {
    ticketId,
    userId,
    session
  };

  // sign the token 
  const qrToken = jwt.sign(payload, secret);

  
  const qrImageURL = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'H', // high for better scanning
    margin: 2
  });

  // save the ticket to the database
  const newTicket = await Ticket.create({
    ticketId,
    userId,
    session,
    qrToken, 
    status: "ACTIVE",
    isCheckedIn: false
  });

  return {
    ticketId: newTicket.ticketId,
    qrCode: qrImageURL,
    qrToken: qrToken
  };
};