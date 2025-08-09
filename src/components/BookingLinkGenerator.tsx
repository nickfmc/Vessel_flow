'use client';

import { useState } from 'react';
import { generateShareableBookingLink } from '~/utils/booking-links';

interface BookingLinkGeneratorProps {
  companySlug: string;
  tourId: string;
  tourTitle: string;
}

export function BookingLinkGenerator({ companySlug, tourId, tourTitle }: BookingLinkGeneratorProps) {
  const [copied, setCopied] = useState(false);
  
  const linkData = generateShareableBookingLink(companySlug, tourId, tourTitle);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareViaEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(linkData.emailSubject)}&body=${encodeURIComponent(linkData.emailBody)}`;
    window.open(mailtoUrl);
  };

  const shareViaSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(linkData.shareText)}`;
    window.open(smsUrl);
  };

  return (
    <div className="c-booking-link-generator">
      <div className="c-booking-link-generator__header">
        <h3 className="c-booking-link-generator__title">Share Booking Link</h3>
        <p className="c-booking-link-generator__subtitle">
          Share this direct booking link with customers
        </p>
      </div>

      {/* Link Display */}
      <div className="c-booking-link-generator__link-container">
        <div className="c-booking-link-generator__link-display">
          <input
            type="text"
            value={linkData.url}
            readOnly
            className="c-booking-link-generator__link-input"
          />
          <button
            onClick={() => copyToClipboard(linkData.url)}
            className="c-booking-link-generator__copy-button"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span className="c-booking-link-generator__copy-text">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className="c-booking-link-generator__share-options">
        <p className="c-booking-link-generator__share-label">Quick Share:</p>
        <div className="c-booking-link-generator__share-buttons">
          <button
            onClick={shareViaEmail}
            className="c-booking-link-generator__share-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          
          <button
            onClick={shareViaSMS}
            className="c-booking-link-generator__share-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            SMS
          </button>

          <button
            onClick={() => copyToClipboard(linkData.shareText)}
            className="c-booking-link-generator__share-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Text
          </button>
        </div>
      </div>
    </div>
  );
}