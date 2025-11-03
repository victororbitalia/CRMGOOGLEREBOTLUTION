import { markNotificationSent } from '../database/services/reservationService';

// API endpoint for external systems to mark notifications as sent
export async function markReservationNotificationSent(req: any, res: any) {
  try {
    const { reservationId } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ error: 'Reservation ID is required' });
    }
    
    const updatedReservation = await markNotificationSent(reservationId);
    
    if (!updatedReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification marked as sent',
      reservation: updatedReservation 
    });
  } catch (error) {
    console.error('Error marking notification as sent:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Function to be used by external systems
export async function markNotificationAsSent(reservationId: string | number): Promise<boolean> {
  try {
    const result = await markNotificationSent(reservationId);
    return !!result;
  } catch (error) {
    console.error('Error marking notification as sent:', error);
    return false;
  }
}