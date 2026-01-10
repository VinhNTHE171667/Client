export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Deposited = 'deposited',
  Approved = 'approved',
  Rejected = 'rejected',
  Paid = 'paid',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Overdue = 'overdue',

  Arrived = 'arrived',    
  InService = 'in_service',
  Refunded = 'refunded'
}

export enum AppointmentHanle {
  Approved = 'approved',
  Rejected = 'rejected',
  Pending = 'pending',
}
