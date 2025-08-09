/**
 * Generate a booking link for a tour
 */
export function generateBookingLink(companySlug: string, tourId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/book/${companySlug}/tour/${tourId}`;
}

/**
 * Generate a shareable booking link with additional context
 */
export function generateShareableBookingLink(
  companySlug: string, 
  tourId: string, 
  tourTitle: string
): {
  url: string;
  shareText: string;
  emailSubject: string;
  emailBody: string;
} {
  const url = generateBookingLink(companySlug, tourId);
  
  return {
    url,
    shareText: `Book your spot on "${tourTitle}" - ${url}`,
    emailSubject: `Book Your Marine Tour: ${tourTitle}`,
    emailBody: `Hi there!\n\nI'd like to invite you to join me on an amazing marine tour experience.\n\nTour: ${tourTitle}\n\nYou can book your spot here: ${url}\n\nLooking forward to an incredible adventure together!\n\nBest regards`,
  };
}