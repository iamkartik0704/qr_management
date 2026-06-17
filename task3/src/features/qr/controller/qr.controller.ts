import { Request, Response } from 'express';
import { generateTicketAndQR } from '../service/qr.service.js';
import { validateTicketScan, revokeTicket } from '../service/validation.service.js';
import { getAttendanceStats } from '../service/attendance.service.js';

export const generateTicket = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, session } = req.body;

    // basic Validation
    if (!userId || !session) {
      return res.status(400).json({ error: "userId and session are required" });
    }

    if (session !== "SESSION_1" && session !== "SESSION_2") {
      return res.status(400).json({ error: "Invalid session type. Must be SESSION_1 or SESSION_2" });
    }
    const validSession = session as "SESSION_1" | "SESSION_2";

    const ticketData = await generateTicketAndQR(userId, validSession);

    return res.status(201).json({
      success: true,
      message: "Secure ticket generated successfully",
      data: ticketData
    });

  } catch (error: any) {
    console.error("QR Generation Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const validateScan = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Frontend only sends the token and what gate they are at
    const { qrToken, currentScanningSession } = req.body;

    // 2. Security Fix: Extract volunteer/admin ID securely from Passport session
    const scannedBy = (req as any).user?._id || (req as any).user?.id;

    if (!scannedBy) {
       return res.status(401).json({ error: "Unauthorized: No volunteer session found" });
    }

    if (!qrToken || !currentScanningSession) {
      return res.status(400).json({ error: "qrToken and currentScanningSession are required" });
    }

    // 3. Pass the current gate session to the service
    const result = await validateTicketScan(qrToken, scannedBy, currentScanningSession);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(403).json(result);
    }

  } catch (error: any) {
    console.error("QR Validation Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = await getAttendanceStats();
    
    return res.status(200).json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error("Stats Error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

export const handleRevoke = async (req: Request, res: Response): Promise<any> => {
  try {
    const { ticketId } = req.body;
    
    // Security check for revoking
    const adminId = (req as any).user?._id || (req as any).user?.id;
    if (!adminId) return res.status(401).json({ error: "Unauthorized" });

    const ticket = await revokeTicket(ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    
    res.status(200).json({ success: true, message: "Ticket revoked" });
  } catch (error) {
    res.status(500).json({ error: "Revocation failed" });
  }
};