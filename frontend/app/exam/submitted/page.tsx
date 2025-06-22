"use client"
import { useSearchParams } from "next/navigation"
import { Button } from "@nextui-org/react"
import { SubmittedTable, type Submission } from "@/components/exam/submitted-table"

// Mock data
const mockSubmissions: Submission[] = [
  {
    _id: '1',
    username: 'John Doe',
    email: 'john@example.com',
    status: 'graded',
    score: 85,
    submissionDate: '2025-06-20 14:30:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=john@example.com'
  },
  {
    _id: '2',
    username: 'Jane Smith',
    email: 'jane@example.com',
    status: 'submitted',
    score: null,
    submissionDate: '2025-06-21 09:15:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=jane@example.com'
  },
  {
    _id: '3',
    username: 'Alex Johnson',
    email: 'alex@example.com',
    status: 'late',
    score: 72,
    submissionDate: '2025-06-22 10:05:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=alex@example.com'
  },
  {
    _id: '4',
    username: 'Sarah Williams',
    email: 'sarah@example.com',
    status: 'graded',
    score: 93,
    submissionDate: '2025-06-20 11:20:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=sarah@example.com'
  },
  {
    _id: '5',
    username: 'Michael Brown',
    email: 'michael@example.com',
    status: 'submitted',
    score: null,
    submissionDate: '2025-06-21 16:45:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=michael@example.com'
  }
];

export default function SubmittedExamPage() {
  const params = useSearchParams();
  const examId = params.get('id');

  const handleView = (id: string) => {
    console.log('View submission:', id);
    // Add your view logic here
  };

  const handleGrade = (id: string) => {
    console.log('Grade submission:', id);
    // Add your grade logic here
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Submissions</h1>
        <div className="text-gray-500">Exam ID: {examId}</div>
      </div>
      
      <div className="">
        <SubmittedTable 
          submissions={mockSubmissions}
          onView={handleView}
          onGrade={handleGrade}
        />
      </div>
    </div>
  );
}