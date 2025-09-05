// Test Framework Types for XAMS System

export interface TestCase {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  testType: 'Functional' | 'Integration' | 'Security' | 'Performance' | 'Usability';
  userRole?: 'Admin' | 'Teacher' | 'Student' | 'Banned' | 'Anonymous';
  preconditions: string[];
  testSteps: TestStep[];
  expectedResult: string;
  actualResult?: string;
  status?: 'Pass' | 'Fail' | 'Blocked' | 'Not Executed';
  executionTime?: number;
  screenshot?: string;
  notes?: string;
  bugId?: string;
  environment: 'Frontend' | 'Backend' | 'End-to-End';
  automatable: boolean;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  data?: any;
  expectedOutcome: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

export interface TestExecution {
  testCaseId: string;
  executedBy: string;
  executionDate: Date;
  environment: string;
  status: 'Pass' | 'Fail' | 'Blocked' | 'Not Executed';
  executionTime: number;
  notes: string;
  screenshots: string[];
}

export interface TestReport {
  suites: TestSuite[];
  executions: TestExecution[];
  summary: TestSummary;
  generatedAt: Date;
}

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  blockedTests: number;
  notExecuted: number;
  passRate: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requiresAuth: boolean;
  roles?: string[];
  description: string;
}

export interface FrontendRoute {
  path: string;
  requiresAuth: boolean;
  roles?: string[];
  component: string;
  description: string;
}
