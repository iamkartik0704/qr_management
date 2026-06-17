import { Ticket } from '../model/ticket.model.js';

export const getAttendanceStats = async () => {
  
  const stats = await Ticket.aggregate([
    { $match: { isCheckedIn: true } },
    { $group: { _id: "$session", count: { $sum: 1 } } }
  ]);
  return stats;
};