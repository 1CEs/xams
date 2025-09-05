import { TestCase, TestSuite } from './types/test-types';

// XAMS-specific Test Scenarios based on actual project analysis
export const XAMS_TEST_SCENARIOS: TestCase[] = [
  // Authentication API Tests - POST, GET methods
  {
    id: 'xams-auth-001',
    category: 'Authentication',
    subcategory: 'User Registration',
    name: 'Student Registration with Complete Profile',
    description: 'Test student can register with username, email, password, profile_url, bio, and personal info',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Anonymous',
    preconditions: ['Backend server running on port 3000', 'Database accessible'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/auth/sign-up with student role data', expectedOutcome: 'Student account created successfully' },
      { stepNumber: 2, action: 'Verify user in database with student role', expectedOutcome: 'User record exists with correct role' }
    ],
    expectedResult: 'Student account created with proper role-based permissions',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-auth-002',
    category: 'Authentication',
    subcategory: 'User Registration',
    name: 'Instructor Registration with Teaching Profile',
    description: 'Test instructor can register with complete teaching profile and bio',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Anonymous',
    preconditions: ['Backend server running', 'Valid instructor registration data'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/auth/sign-up with instructor role', expectedOutcome: 'Instructor account created' },
      { stepNumber: 2, action: 'Verify instructor can access teaching features', expectedOutcome: 'Teaching features accessible' }
    ],
    expectedResult: 'Instructor account created with teaching permissions',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-auth-003',
    category: 'Authentication',
    subcategory: 'User Login',
    name: 'User Sign In with Email and Password',
    description: 'Test user can sign in and receive JWT access and refresh tokens',
    priority: 'Critical',
    testType: 'Functional',
    userRole: 'Student',
    preconditions: ['User account exists in system', 'Valid credentials available'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/auth/sign-in with valid credentials', expectedOutcome: 'JWT tokens returned' },
      { stepNumber: 2, action: 'Verify tokens are valid and properly formatted', expectedOutcome: 'Tokens pass validation' }
    ],
    expectedResult: 'User signed in with valid JWT tokens',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-auth-004',
    category: 'Authentication',
    subcategory: 'Password Management',
    name: 'Password Reset Workflow',
    description: 'Test complete password reset flow with token generation and validation',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Student',
    preconditions: ['User account exists', 'Email service configured'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/auth/forgot-password with email', expectedOutcome: 'Reset token generated' },
      { stepNumber: 2, action: 'POST /api/auth/reset-password with token and new password', expectedOutcome: 'Password updated successfully' }
    ],
    expectedResult: 'Password reset completed successfully',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-auth-005',
    category: 'Authentication',
    subcategory: 'Session Management',
    name: 'User Profile Retrieval',
    description: 'Test authenticated user can retrieve profile data via GET /api/auth/me',
    priority: 'Medium',
    testType: 'Functional',
    userRole: 'Student',
    preconditions: ['User is authenticated with valid JWT token'],
    testSteps: [
      { stepNumber: 1, action: 'GET /api/auth/me with valid token', expectedOutcome: 'User profile data returned' }
    ],
    expectedResult: 'User profile retrieved with role and permissions',
    environment: 'Backend',
    automatable: true
  },

  // Course Management Tests - POST, GET, PATCH, DELETE methods
  {
    id: 'xams-course-001',
    category: 'Course Management',
    subcategory: 'Course Creation',
    name: 'Create Course with Mathematics Category',
    description: 'Test instructor can create course with mathematics category and proper metadata',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Instructor is authenticated', 'Valid course data available'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/course with mathematics category', expectedOutcome: 'Course created successfully' },
      { stepNumber: 2, action: 'Verify course appears in course list', expectedOutcome: 'Course listed in GET /api/course' }
    ],
    expectedResult: 'Mathematics course created with proper categorization',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-course-002',
    category: 'Course Management',
    subcategory: 'Course Browsing',
    name: 'Public Course Listing with Search',
    description: 'Test public can browse courses and use search functionality',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Anonymous',
    preconditions: ['Courses exist in database', 'Search functionality enabled'],
    testSteps: [
      { stepNumber: 1, action: 'GET /api/course without authentication', expectedOutcome: 'Public courses returned' },
      { stepNumber: 2, action: 'GET /api/course?search=mathematics', expectedOutcome: 'Filtered results returned' }
    ],
    expectedResult: 'Course browsing and search work for public users',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-course-003',
    category: 'Course Management',
    subcategory: 'Course Groups',
    name: 'Create Course Group with Join Code',
    description: 'Test instructor can create course groups with join codes and student management',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Course exists', 'Instructor has course permissions'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/course/:id/group with group data', expectedOutcome: 'Group created with join code' },
      { stepNumber: 2, action: 'Verify group can be updated via PATCH', expectedOutcome: 'Group updates successful' }
    ],
    expectedResult: 'Course group created with student management capabilities',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-course-004',
    category: 'Course Management',
    subcategory: 'Course Updates',
    name: 'Update Course Information',
    description: 'Test instructor can update course details using PATCH method',
    priority: 'Medium',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Course exists', 'Instructor owns course'],
    testSteps: [
      { stepNumber: 1, action: 'PATCH /api/course/:id with updated data', expectedOutcome: 'Course updated successfully' }
    ],
    expectedResult: 'Course information updated correctly',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-course-005',
    category: 'Course Management',
    subcategory: 'Course Deletion',
    name: 'Delete Course',
    description: 'Test instructor can delete courses using DELETE method',
    priority: 'Medium',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Course exists', 'Instructor owns course'],
    testSteps: [
      { stepNumber: 1, action: 'DELETE /api/course/:id', expectedOutcome: 'Course deleted successfully' },
      { stepNumber: 2, action: 'Verify course no longer in listing', expectedOutcome: 'Course not found in GET requests' }
    ],
    expectedResult: 'Course deleted and removed from system',
    environment: 'Backend',
    automatable: true
  },

  // Examination Tests - POST, GET, PATCH methods
  {
    id: 'xams-exam-001',
    category: 'Examination',
    subcategory: 'Exam Creation',
    name: 'Create Multiple Choice Examination',
    description: 'Test instructor can create exam with MC questions, choices, and scoring',
    priority: 'Critical',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Instructor authenticated', 'Question bank available'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/exam with MC question data', expectedOutcome: 'Exam created with MC questions' },
      { stepNumber: 2, action: 'Verify exam appears in instructor exam list', expectedOutcome: 'Exam listed in GET /api/exam' }
    ],
    expectedResult: 'MC exam created with proper scoring and randomization options',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-exam-002',
    category: 'Examination',
    subcategory: 'Exam Creation',
    name: 'Create Essay Questions with AI Grading',
    description: 'Test creation of essay questions (LES/SES) with AI grading capability',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['AI grading service available', 'Essay question templates ready'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/exam with essay questions and AI grading enabled', expectedOutcome: 'Essay exam created' },
      { stepNumber: 2, action: 'Verify AI grading settings are stored', expectedOutcome: 'AI grading configuration saved' }
    ],
    expectedResult: 'Essay exam created with AI grading capability',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-exam-003',
    category: 'Examination',
    subcategory: 'Exam Scheduling',
    name: 'Create Exam Schedule with Security Settings',
    description: 'Test instructor can schedule exams with time limits, IP restrictions, and randomization',
    priority: 'Critical',
    testType: 'Functional',
    userRole: 'Teacher',
    preconditions: ['Exam exists', 'Course group exists'],
    testSteps: [
      { stepNumber: 1, action: 'POST /api/course/:id/group/:name/exam-setting with security settings', expectedOutcome: 'Exam schedule created' },
      { stepNumber: 2, action: 'Verify security settings are enforced', expectedOutcome: 'IP and time restrictions active' }
    ],
    expectedResult: 'Exam scheduled with all security and timing constraints',
    environment: 'Backend',
    automatable: true
  },

  // User Management Tests - GET, PATCH, DELETE methods
  {
    id: 'xams-user-001',
    category: 'User Management',
    subcategory: 'User Listing',
    name: 'Admin Get All Users',
    description: 'Test admin can retrieve list of all system users',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Admin',
    preconditions: ['Admin authenticated', 'Users exist in system'],
    testSteps: [
      { stepNumber: 1, action: 'GET /api/user with admin token', expectedOutcome: 'All users returned' }
    ],
    expectedResult: 'Complete user list retrieved successfully',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-user-002',
    category: 'User Management',
    subcategory: 'User Updates',
    name: 'Update User Profile',
    description: 'Test user can update their profile information using PATCH',
    priority: 'Medium',
    testType: 'Functional',
    userRole: 'Student',
    preconditions: ['User authenticated', 'Valid update data'],
    testSteps: [
      { stepNumber: 1, action: 'PATCH /api/user/:id with profile updates', expectedOutcome: 'Profile updated successfully' }
    ],
    expectedResult: 'User profile information updated correctly',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-user-003',
    category: 'User Management',
    subcategory: 'User Banning',
    name: 'Ban User with Reason and Duration',
    description: 'Test admin can ban users with ban reason, duration, and permanent options',
    priority: 'High',
    testType: 'Functional',
    userRole: 'Admin',
    preconditions: ['Admin authenticated', 'Target user exists'],
    testSteps: [
      { stepNumber: 1, action: 'PATCH /api/user/ban/:id with ban details', expectedOutcome: 'User banned successfully' },
      { stepNumber: 2, action: 'Verify banned user cannot access system', expectedOutcome: 'Access properly restricted' }
    ],
    expectedResult: 'User banned with proper access restrictions enforced',
    environment: 'Backend',
    automatable: true
  },

  // Frontend Page Tests using Puppeteer
  {
    id: 'xams-frontend-001',
    category: 'Frontend Testing',
    subcategory: 'Authentication Pages',
    name: 'Sign-up Page Functionality',
    description: 'Test sign-up page loads and form submission works correctly',
    priority: 'High',
    testType: 'Usability',
    userRole: 'Anonymous',
    preconditions: ['Frontend server running on port 8080', 'Puppeteer configured'],
    testSteps: [
      { stepNumber: 1, action: 'Navigate to /member/sign-up', expectedOutcome: 'Sign-up page loads' },
      { stepNumber: 2, action: 'Fill registration form and submit', expectedOutcome: 'Form submission successful' }
    ],
    expectedResult: 'Sign-up page functions correctly with form validation',
    environment: 'Frontend',
    automatable: true
  },
  {
    id: 'xams-frontend-002',
    category: 'Frontend Testing',
    subcategory: 'Course Browsing',
    name: 'Course Exploration Interface',
    description: 'Test course exploration page displays courses and search works',
    priority: 'High',
    testType: 'Usability',
    userRole: 'Anonymous',
    preconditions: ['Courses exist in database', 'Frontend accessible'],
    testSteps: [
      { stepNumber: 1, action: 'Navigate to /explore', expectedOutcome: 'Course list displayed' },
      { stepNumber: 2, action: 'Use search functionality', expectedOutcome: 'Search results filtered correctly' }
    ],
    expectedResult: 'Course exploration interface works smoothly',
    environment: 'Frontend',
    automatable: true
  },
  {
    id: 'xams-frontend-003',
    category: 'Frontend Testing',
    subcategory: 'Role-based Access',
    name: 'Teacher Dashboard Access',
    description: 'Test teacher can access teaching dashboard and course creation tools',
    priority: 'High',
    testType: 'Usability',
    userRole: 'Teacher',
    preconditions: ['Teacher account authenticated', 'Teaching features enabled'],
    testSteps: [
      { stepNumber: 1, action: 'Navigate to /overview/@teacher', expectedOutcome: 'Teacher dashboard loads' },
      { stepNumber: 2, action: 'Access course creation interface', expectedOutcome: 'Course creation tools available' }
    ],
    expectedResult: 'Teacher dashboard and tools function correctly',
    environment: 'Frontend',
    automatable: true
  },
  {
    id: 'xams-frontend-004',
    category: 'Frontend Testing',
    subcategory: 'Exam Interface',
    name: 'Student Exam Taking Interface',
    description: 'Test student can navigate exam interface and submit answers',
    priority: 'Critical',
    testType: 'Usability',
    userRole: 'Student',
    preconditions: ['Student enrolled in course', 'Exam scheduled and accessible'],
    testSteps: [
      { stepNumber: 1, action: 'Navigate to /exam', expectedOutcome: 'Exam interface loads' },
      { stepNumber: 2, action: 'Answer questions and submit exam', expectedOutcome: 'Submission successful' }
    ],
    expectedResult: 'Exam interface is user-friendly and submission works',
    environment: 'Frontend',
    automatable: true
  },

  // Security Tests
  {
    id: 'xams-security-001',
    category: 'Security',
    subcategory: 'Authentication Security',
    name: 'JWT Token Security Validation',
    description: 'Test JWT tokens are properly secured and validated',
    priority: 'Critical',
    testType: 'Security',
    userRole: 'Anonymous',
    preconditions: ['Authentication system active', 'Token validation enabled'],
    testSteps: [
      { stepNumber: 1, action: 'Attempt access with expired token', expectedOutcome: 'Access denied' },
      { stepNumber: 2, action: 'Attempt access with malformed token', expectedOutcome: 'Token rejected' }
    ],
    expectedResult: 'JWT security properly implemented and enforced',
    environment: 'Backend',
    automatable: true
  },
  {
    id: 'xams-security-002',
    category: 'Security',
    subcategory: 'Input Validation',
    name: 'Form Input Sanitization',
    description: 'Test all form inputs are properly validated and sanitized',
    priority: 'High',
    testType: 'Security',
    userRole: 'Anonymous',
    preconditions: ['Input validation schemas active', 'Security measures enabled'],
    testSteps: [
      { stepNumber: 1, action: 'Submit forms with malicious input', expectedOutcome: 'Input rejected with proper error' },
      { stepNumber: 2, action: 'Test XSS prevention in form fields', expectedOutcome: 'XSS attempts sanitized' }
    ],
    expectedResult: 'All inputs properly validated and sanitized',
    environment: 'Backend',
    automatable: true
  },

  // Integration Tests
  {
    id: 'xams-integration-001',
    category: 'Integration',
    subcategory: 'End-to-End Workflow',
    name: 'Complete Course and Exam Lifecycle',
    description: 'Test complete workflow from course creation to student exam completion',
    priority: 'Critical',
    testType: 'Integration',
    userRole: 'Teacher',
    preconditions: ['All system components running', 'Test data prepared'],
    testSteps: [
      { stepNumber: 1, action: 'Create course as instructor', expectedOutcome: 'Course created' },
      { stepNumber: 2, action: 'Add course group and schedule exam', expectedOutcome: 'Exam scheduled' },
      { stepNumber: 3, action: 'Student enrolls and takes exam', expectedOutcome: 'Exam completed' },
      { stepNumber: 4, action: 'View results and grading', expectedOutcome: 'Results properly calculated' }
    ],
    expectedResult: 'Complete course lifecycle functions end-to-end',
    environment: 'End-to-End',
    automatable: true
  }
];

export const XAMS_TEST_SUITES: TestSuite[] = [
  {
    id: 'XAMS_AUTH_SUITE',
    name: 'XAMS Authentication Suite',
    description: 'Complete authentication testing including registration, login, and password management',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Authentication')
  },
  {
    id: 'XAMS_COURSE_SUITE',
    name: 'XAMS Course Management Suite', 
    description: 'Course creation, management, and browsing functionality',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Course Management')
  },
  {
    id: 'XAMS_EXAM_SUITE',
    name: 'XAMS Examination Suite',
    description: 'Exam creation, scheduling, and taking functionality',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Examination')
  },
  {
    id: 'XAMS_USER_SUITE',
    name: 'XAMS User Management Suite',
    description: 'User management, profiles, and administration',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'User Management')
  },
  {
    id: 'XAMS_FRONTEND_SUITE',
    name: 'XAMS Frontend Testing Suite',
    description: 'Frontend interface and user experience testing',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Frontend Testing')
  },
  {
    id: 'XAMS_SECURITY_SUITE',
    name: 'XAMS Security Testing Suite',
    description: 'Security validation and vulnerability testing',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Security')
  },
  {
    id: 'XAMS_INTEGRATION_SUITE',
    name: 'XAMS Integration Testing Suite',
    description: 'End-to-end workflow and integration testing',
    testCases: XAMS_TEST_SCENARIOS.filter(tc => tc.category === 'Integration')
  }
];
