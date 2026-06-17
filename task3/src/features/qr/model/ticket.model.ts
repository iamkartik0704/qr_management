import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  userId: string; 
  session: "SESSION_1" | "SESSION_2";
  qrToken: string;
  
  status: "ACTIVE" | "REVOKED" | "USED";
  isCheckedIn: boolean;
  checkedInAt?: Date;
}

const ticketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, 
  session: { type: String, enum: ["SESSION_1", "SESSION_2"], required: true },
  qrToken: { type: String, required: true },
  status: { type: String, enum: ["ACTIVE", "REVOKED", "USED"], default: "ACTIVE" },
  isCheckedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date }
}, { timestamps: true });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);