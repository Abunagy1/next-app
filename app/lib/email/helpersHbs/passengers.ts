export default function passengers(passengers: any[], seats: any[]): any[] {
  return passengers.map((p) => {
    const seat = seats.find((s) => s.reservation.for === p._id);
    return {
      firstName: p.firstName,
      lastName: p.lastName,
      seatNumber: seat?.seatNumber,
      seatClass: seat?.class,
      type: p.passengerType,
    };
  });
}