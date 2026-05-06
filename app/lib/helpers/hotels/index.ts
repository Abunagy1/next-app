/**
 * Parse hotel check-in or check-out policy time from string in format HH:MM
 * into an object with hour and minute properties.
 */
export function parseHotelCheckInOutPolicy(checkInOrOut: string): { hour: number; minute: number } {
  const timeStrRegex = /(\d{2}):(\d{2})/g;
  const isValid = timeStrRegex.test(checkInOrOut);
  if (!isValid) {
    throw new Error(`Invalid time format. Expected HH:MM format. Got: ${checkInOrOut}`);
  }
  const timeArr = checkInOrOut.split(':');
  return {
    hour: Number(timeArr[0]),
    minute: Number(timeArr[1]),
  };
}