"use client"
import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider } from '@nextui-org/react'

interface TermsOfServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        body: "py-6",
        base: "border-gray-600/30 bg-background/95 backdrop-blur-md text-foreground",
        header: "border-b-[1px] border-gray-600/30",
        footer: "border-t-[1px] border-gray-600/30",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold hero-foreground">Terms of Service</h2>
          <p className="text-sm text-gray-400">Please read and accept our terms of service to continue</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">1. Acceptable Use Policy</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• Be respectful and courteous to all users and instructors</li>
                <li>• Do not post, share, or create offensive, abusive, or discriminatory content</li>
                <li>• Refrain from using profanity, hate speech, or harassment of any kind</li>
                <li>• Do not spam or post repetitive, irrelevant, or promotional content</li>
              </ul>
            </section>

            <Divider className="bg-gray-600/50" />

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">2. Academic Integrity</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• Do not share exam answers or engage in cheating during assessments</li>
                <li>• Submit only your own original work unless collaboration is explicitly permitted</li>
                <li>• Do not plagiarize content from other sources without proper attribution</li>
                <li>• Report any suspected academic dishonesty to instructors or administrators</li>
              </ul>
            </section>

            <Divider className="bg-gray-600/50" />

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">3. Content Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• Keep discussions relevant to course topics and educational purposes</li>
                <li>• Do not share copyrighted material without proper authorization</li>
                <li>• Avoid posting personal information or sensitive data</li>
                <li>• Use appropriate language and maintain professional communication</li>
              </ul>
            </section>

            <Divider className="bg-gray-600/50" />

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">4. Platform Usage</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• Use the platform only for its intended educational purposes</li>
                <li>• Do not attempt to hack, exploit, or disrupt the system</li>
                <li>• Keep your account credentials secure and do not share them</li>
                <li>• Report technical issues or bugs to our support team</li>
              </ul>
            </section>

            <Divider className="bg-gray-600/50" />

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">5. Consequences of Violations</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• First-time violations may result in warnings or temporary restrictions</li>
                <li>• Repeated violations may lead to account suspension or termination</li>
                <li>• Serious violations may result in immediate permanent ban</li>
                <li>• We reserve the right to report illegal activities to authorities</li>
              </ul>
            </section>

            <Divider className="bg-gray-600/50" />

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">6. Privacy and Data</h3>
              <ul className="space-y-2 text-sm text-gray-300 ml-4">
                <li>• We collect and process data in accordance with our Privacy Policy</li>
                <li>• Your personal information will be kept secure and confidential</li>
                <li>• We may use anonymous data for platform improvement purposes</li>
                <li>• You have the right to request data deletion upon account closure</li>
              </ul>
            </section>

            <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Important:</strong> By accepting these terms, you agree to abide by all rules and guidelines. 
                Violation of these terms may result in account restrictions or termination without prior notice.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            onPress={onClose}
            className="hero-background text-background"
          >
            I Understand
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default TermsOfServiceModal
