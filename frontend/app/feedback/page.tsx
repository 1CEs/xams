'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { useUserStore } from '@/stores/user.store';
import Loading from '@/components/state/loading';

export default function FeedbackPage() {
  const { user } = useUserStore();

  // Define form URLs based on user role
  const getFormUrl = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'https://docs.google.com/forms/d/e/1FAIpQLSdJPJN9pswYgZBmYefir02-tQqQwoqlIcsKnYuMf7LNEJHMIw/viewform?embedded=true';
      case 'student': // learner
        return 'https://docs.google.com/forms/d/e/1FAIpQLSe9v1Yp-ll3nNHXGdbjS6Mct6Ira1PZ3DdHBSOn8Y9UzF5AHg/viewform?embedded=true';
      case 'instructor':
        return 'https://docs.google.com/forms/d/e/1FAIpQLSc9msMrJKiyFT4pV1A9H3Vyz05HPH8DhHtdbYQdx3bt1wzLQw/viewform?embedded=true';
      default:
        // Default to student form if role is not recognized
        return 'https://docs.google.com/forms/d/e/1FAIpQLSe9v1Yp-ll3nNHXGdbjS6Mct6Ira1PZ3DdHBSOn8Y9UzF5AHg/viewform?embedded=true';
    }
  };

  const getRoleDisplayName = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'student':
        return 'Learner';
      case 'instructor':
        return 'Instructor';
      default:
        return 'User';
    }
  };

  // Show loading if user data is not available yet
  if (!user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold hero-foreground mb-4">
          Feedback
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          We value your input! Your feedback helps us improve <span className="text-highlight">XAMS</span> and provide a better learning experience for everyone.
        </p>
      </div>

      {/* Feedback Form Container */}
      <div className="w-full max-w-4xl">
        <Card className="bg-black/20 backdrop-blur-sm border-l-4 border-primary shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex flex-col space-y-2">
              <h2 className="text-2xl font-bold text-primary">Share Your Experience</h2>
              <p className="text-gray-400 text-sm">
                Please take a moment to share your thoughts, suggestions, or report any issues you've encountered as a <span className="text-primary font-medium">{getRoleDisplayName(user.role)}</span>.
              </p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {/* Google Form Container */}
            <div className="w-full overflow-hidden rounded-lg bg-white/5 p-2 sm:p-4">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[640px] mx-auto">
                  <iframe 
                    src={getFormUrl(user.role)} 
                    width="100%" 
                    height="4856" 
                    frameBorder="0" 
                    marginHeight={0} 
                    marginWidth={0}
                    className="rounded-lg"
                    title={`XAMS Feedback Form - ${getRoleDisplayName(user.role)}`}
                  >
                    กำลังโหลด…
                  </iframe>
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="mt-6 p-4 bg-black/30 rounded-lg border-l-2 border-secondary">
              <h3 className="text-lg font-semibold text-secondary mb-2">Alternative Contact Methods</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                If you're unable to submit the form above, you can also reach us through other channels. 
                We appreciate all feedback and strive to respond promptly to your inquiries.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Spacing for Mobile */}
      <div className="pb-20 sm:pb-8" />
    </div>
  );
}