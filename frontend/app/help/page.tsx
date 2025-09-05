"use client"

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, Tab, Tabs, Divider, Chip, Button, Accordion, AccordionItem } from '@nextui-org/react'
import { 
  FluentClass24Filled, 
  FaGroup, 
  PhStudentFill, 
  FluentSettings16Filled, 
  HealthiconsIExamMultipleChoice,
  FluentColorWarning16, 
  IconParkOutlineCheckCorrect, 
  MaterialSymbolsListAlt 
} from '@/components/icons/icons'

export default function HelpPage() {
  const [selectedSection, setSelectedSection] = useState('overview')

  const navigationItems = [
    { key: 'overview', label: 'Overview', icon: <MaterialSymbolsListAlt className="w-4 h-4" /> },
    { key: 'student', label: 'Student Guide', icon: <PhStudentFill className="w-4 h-4" /> },
    { key: 'instructor', label: 'Instructor Guide', icon: <FaGroup className="w-4 h-4" /> },
    { key: 'technical', label: 'Technical', icon: <FluentSettings16Filled className="w-4 h-4" /> }
  ]

  const sectionContent = {
    overview: {
      title: "System Overview",
      icon: <MaterialSymbolsListAlt className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">XAMS - Examination and Assignment Management System</h2>
            <p className="text-default-600 mb-4">
              <strong>XAMS (きょういくざむす)</strong> is a comprehensive web-based examination and assignment management system 
              designed to streamline educational processes for both instructors and students.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Key Features</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Supported Browsers:</strong> Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Internet Connection:</strong> Stable broadband connection (minimum 5 Mbps recommended)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>JavaScript:</strong> Must be enabled in browser settings
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Cookies:</strong> Must be enabled for authentication and session management
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Role-based Access Control:</strong> Separate interfaces for students, instructors, and administrators
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Comprehensive Exam Management:</strong> Create, schedule, and grade various question types
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Question Bank System:</strong> Organize questions in hierarchical banks for reuse
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Real-time Exam Taking:</strong> Secure online examination environment
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Automated Grading:</strong> AI-assisted grading for multiple choice and essay questions
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <strong>Analytics & Reporting:</strong> Detailed performance tracking and statistics
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Getting Started</h3>
            </CardHeader>
            <CardBody>
              <Accordion>
                <AccordionItem key="account" title="Account Creation">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Navigate to the XAMS homepage</li>
                    <li>Click <strong>"Become our member"</strong> or <strong>"Sign Up"</strong></li>
                    <li>Fill in your registration details (email, username, password, name)</li>
                    <li>Verify your email address</li>
                    <li>Your account role will be assigned by an administrator</li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="signin" title="Signing In">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to the <strong>Sign In</strong> page</li>
                    <li>Enter your username/email and password</li>
                    <li>Click <strong>"Sign In"</strong></li>
                    <li>You'll be redirected to your role-specific dashboard</li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="password" title="Password Recovery">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <strong>"Forgot Password"</strong> on the sign-in page</li>
                    <li>Enter your registered email address</li>
                    <li>Check your email for reset instructions</li>
                    <li>Follow the link to create a new password</li>
                  </ol>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </div>
      )
    },
    student: {
      title: "Student Guide",
      icon: <PhStudentFill className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Student/Learner Guide</h2>
            <p className="text-default-600 mb-4">
              Complete guide for students to navigate the XAMS platform effectively.
            </p>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Dashboard Overview</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Chip color="primary" variant="flat">📅</Chip>
                  <div>
                    <strong>Upcoming Tab:</strong> View upcoming exams and assignments, see deadlines and scheduled exam times
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Chip color="secondary" variant="flat">📚</Chip>
                  <div>
                    <strong>My Courses Tab:</strong> Access all enrolled courses, view course materials and track progress
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Chip color="success" variant="flat">🔍</Chip>
                  <div>
                    <strong>Available Courses Tab:</strong> Browse and discover new courses, enroll in open courses
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Taking Exams</h3>
            </CardHeader>
            <CardBody>
              <Accordion>
                <AccordionItem key="access" title="Accessing an Exam">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Navigate to <strong>"My Courses"</strong> or <strong>"Upcoming"</strong></li>
                    <li>Click on an available exam</li>
                    <li>Verify exam details (time limit, instructions, etc.)</li>
                    <li>Enter exam password if required</li>
                    <li>Check IP restrictions if applicable</li>
                    <li>Click <strong>"Start Exam"</strong></li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="during" title="During the Exam">
                  <div className="space-y-3 text-sm">
                    <div><strong>Timer:</strong> Always visible showing remaining time</div>
                    <div><strong>Question Navigation:</strong> Use the question list to jump between questions</div>
                    <div>
                      <strong>Answer Types:</strong>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><strong>Multiple Choice (MC):</strong> Select correct answers</li>
                        <li><strong>True/False (TF):</strong> Choose true or false</li>
                        <li><strong>Short Essay (SES):</strong> Write brief text responses</li>
                        <li><strong>Long Essay (LES):</strong> Write detailed essay responses</li>
                        <li><strong>Nested Questions:</strong> Complete sub-questions within main questions</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem key="submit" title="Submitting Your Exam">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Review all answers using the question navigation</li>
                    <li>Click <strong>"Submit Exam"</strong> when ready</li>
                    <li>Confirm submission in the modal dialog</li>
                    <li>View immediate results (if enabled by instructor)</li>
                  </ol>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Question Navigation</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center text-white text-sm">1</div>
                <span>Answered Questions (Green)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-sm">2</div>
                <span>Current Question (Highlighted)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-default-200 rounded-md flex items-center justify-center text-default-600 text-sm">3</div>
                <span>Unanswered Questions</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )
    },
    instructor: {
      title: "Instructor Guide",
      icon: <FaGroup className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Instructor/Teacher Guide</h2>
            <p className="text-default-600 mb-4">
              Comprehensive guide for instructors to manage courses, create exams, and track student progress.
            </p>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Dashboard Overview</h3>
            </CardHeader>
            <CardBody>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Left Panel - Quick Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Search courses and exams</li>
                    <li>Sort and filter options</li>
                    <li>Quick create actions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Main Panel - Content</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>📚 Course Tab: Manage courses and groups</li>
                    <li>🏦 Bank Tab: Organize question banks</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Course Management</h3>
            </CardHeader>
            <CardBody>
              <Accordion>
                <AccordionItem key="create-course" title="Creating a Course">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <strong>"Create"</strong> → <strong>"New Course"</strong></li>
                    <li>Fill in course details (name, description, code)</li>
                    <li>Set enrollment settings</li>
                    <li>Save the course</li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="groups" title="Managing Student Groups">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Open your course</li>
                    <li>Click <strong>"Add Group"</strong></li>
                    <li>Add students manually or via import</li>
                    <li>Configure group settings</li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="enrollment" title="Student Enrollment">
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Manual Enrollment:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Add students individually</li>
                        <li>Import from user lists</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Self-Enrollment:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Provide course/group codes</li>
                        <li>Set enrollment periods</li>
                        <li>Review and approve enrollments</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Exam Creation</h3>
            </CardHeader>
            <CardBody>
              <Accordion>
                <AccordionItem key="exam-types" title="Question Types">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Chip size="sm" color="primary">MC</Chip>
                      <div><strong>Multiple Choice:</strong> Add question text, create answer choices, mark correct answers</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Chip size="sm" color="secondary">TF</Chip>
                      <div><strong>True/False:</strong> Write statements, set correct answers</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Chip size="sm" color="success">SES</Chip>
                      <div><strong>Short Essay:</strong> Provide prompts, set character limits</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Chip size="sm" color="warning">LES</Chip>
                      <div><strong>Long Essay:</strong> Create detailed prompts, provide rubrics</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Chip size="sm" color="danger">Nested</Chip>
                      <div><strong>Nested Questions:</strong> Create parent questions with sub-questions</div>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem key="question-banks" title="Question Bank Management">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Navigate to <strong>"🏦 Bank"</strong> tab</li>
                    <li>Create new banks for organizing questions</li>
                    <li>Create sub-banks for hierarchical organization</li>
                    <li>Link questions to appropriate banks</li>
                    <li>Reuse questions across multiple exams</li>
                  </ol>
                </AccordionItem>
                <AccordionItem key="exam-settings" title="Exam Scheduling & Settings">
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Essential Settings:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Schedule name and exam selection</li>
                        <li>Open/close times and duration</li>
                        <li>IP range restrictions</li>
                        <li>Exam password protection</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Question Behavior:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Randomize questions and choices</li>
                        <li>Limit question count</li>
                        <li>Select specific questions</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Grading Options:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Total score configuration</li>
                        <li>Show answers after submission</li>
                        <li>AI-assisted grading for essays</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </div>
      )
    },
    technical: {
      title: "Technical Requirements",
      icon: <FluentSettings16Filled className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Technical Requirements & Troubleshooting</h2>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">System Requirements</h3>
            </CardHeader>
            <CardBody>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Browser Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <IconParkOutlineCheckCorrect className="w-4 h-4 text-success" />
                      Chrome 80+ (recommended)
                    </li>
                    <li className="flex items-center gap-2">
                      <IconParkOutlineCheckCorrect className="w-4 h-4 text-success" />
                      Firefox 75+
                    </li>
                    <li className="flex items-center gap-2">
                      <IconParkOutlineCheckCorrect className="w-4 h-4 text-success" />
                      Safari 13+
                    </li>
                    <li className="flex items-center gap-2">
                      <IconParkOutlineCheckCorrect className="w-4 h-4 text-success" />
                      Edge 80+
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Hardware</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>RAM:</strong> 4GB minimum, 8GB recommended</li>
                    <li><strong>Storage:</strong> 1GB free space</li>
                    <li><strong>Display:</strong> 1024x768 minimum</li>
                    <li><strong>Network:</strong> 1 Mbps minimum</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Common Issues & Solutions</h3>
            </CardHeader>
            <CardBody>
              <Accordion>
                <AccordionItem 
                  key="login" 
                  title={
                    <div className="flex items-center gap-2">
                      <FluentColorWarning16 className="w-4 h-4 text-warning" />
                      Login Problems
                    </div>
                  }
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Issue:</strong> Cannot sign in
                    </div>
                    <div>
                      <strong>Solutions:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Verify username/email and password</li>
                        <li>Check for CAPS LOCK</li>
                        <li>Use password reset if forgotten</li>
                        <li>Clear browser cache and cookies</li>
                        <li>Contact administrator for account issues</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem 
                  key="exam-access" 
                  title={
                    <div className="flex items-center gap-2">
                      <FluentColorWarning16 className="w-4 h-4 text-warning" />
                      Exam Access Issues
                    </div>
                  }
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Issue:</strong> Cannot start exam
                    </div>
                    <div>
                      <strong>Solutions:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Check if exam is within allowed time window</li>
                        <li>Verify IP address restrictions</li>
                        <li>Ensure exam password is correct</li>
                        <li>Confirm enrollment in the course</li>
                        <li>Check attempt limits haven't been exceeded</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem 
                  key="submission" 
                  title={
                    <div className="flex items-center gap-2">
                      <FluentColorWarning16 className="w-4 h-4 text-warning" />
                      Browser Compatibility
                    </div>
                  }
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Issue:</strong> Browser incompatibility
                    </div>
                    <div>
                      <strong>Solutions:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Check browser version</li>
                        <li>Try different browser</li>
                        <li>Clear browser cache</li>
                        <li>Disable browser extensions</li>
                        <li>Contact technical support</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem 
                  key="performance" 
                  title={
                    <div className="flex items-center gap-2">
                      <FluentColorWarning16 className="w-4 h-4 text-warning" />
                      Performance Issues
                    </div>
                  }
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Issue:</strong> Slow loading or timeouts
                    </div>
                    <div>
                      <strong>Solutions:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Check internet connection speed</li>
                        <li>Close unnecessary browser tabs</li>
                        <li>Clear browser cache</li>
                        <li>Restart browser</li>
                        <li>Try different browser</li>
                        <li>Contact technical support</li>
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Best Practices</h3>
            </CardHeader>
            <CardBody>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-success">For Students</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Test your system before exam day</li>
                    <li>Find a quiet, stable internet location</li>
                    <li>Monitor the exam timer regularly</li>
                    <li>Don't panic during technical issues</li>
                    <li>Contact instructor immediately for problems</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-primary">For Instructors</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Set up exams well before deadline</li>
                    <li>Test your own exams thoroughly</li>
                    <li>Clearly explain procedures to students</li>
                    <li>Have backup plans for technical issues</li>
                    <li>Be available during exam periods</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <HealthiconsIExamMultipleChoice className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Help & Documentation</h1>
          </div>
          <p className="text-default-600 text-lg">
            Complete guide to using the XAMS platform effectively
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h3 className="font-semibold">Quick Navigation</h3>
              </CardHeader>
              <CardBody className="space-y-2">
                {Object.entries(sectionContent).map(([key, section]) => (
                  <Button
                    key={key}
                    variant={selectedSection === key ? "solid" : "light"}
                    color={selectedSection === key ? "secondary" : "default"}
                    className="justify-start w-full"
                    startContent={section.icon}
                    onPress={() => setSelectedSection(key)}
                  >
                    {section.title}
                  </Button>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardBody className="p-6 md:p-8">
                {sectionContent[selectedSection as keyof typeof sectionContent].content}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card>
            <CardBody>
              <div className="flex items-center justify-center gap-2 mb-2">
                <MaterialSymbolsListAlt className="w-5 h-5 text-primary" />
                <span className="font-semibold">Need More Help?</span>
              </div>
              <p className="text-default-600 text-sm">
                This documentation is current as of the latest system version. 
                For the most up-to-date information, please check the help section within your XAMS dashboard.
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button size="sm" variant="flat" color="primary">
                  Contact Support
                </Button>
                <Button size="sm" variant="flat" color="secondary">
                  Report Issue
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}