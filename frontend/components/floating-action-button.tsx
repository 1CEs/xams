'use client';

import React, { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { useRouter } from 'nextjs-toploader/app';
import { usePathname } from 'next/navigation';

const MessageCircleIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const FloatingActionButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleFeedbackClick = () => {
    // Check if user is on exam path
    if (pathname?.startsWith('/exam')) {
      setIsConfirmModalOpen(true);
    } else {
      router.push('/feedback');
    }
  };

  const handleConfirmNavigation = () => {
    setIsConfirmModalOpen(false);
    router.push('/feedback');
  };

  const handleCancelNavigation = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <Button
        isIconOnly
        color="secondary"
        variant="shadow"
        size="md"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        onClick={handleFeedbackClick}
        aria-label="Send Feedback"
      >
        <MessageCircleIcon />
      </Button>

      <Modal 
        isOpen={isConfirmModalOpen} 
        onOpenChange={setIsConfirmModalOpen}
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-warning">Leave Exam?</h3>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-600">
                  You are currently taking an exam. Are you sure you want to leave to send feedback? 
                  Your progress may be lost if you navigate away.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={handleCancelNavigation}
                >
                  Cancel
                </Button>
                <Button 
                  color="warning" 
                  onPress={handleConfirmNavigation}
                >
                  Yes, Send Feedback
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default FloatingActionButton;
