import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from "@nextui-org/react";

// Types
export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'unsubmitted';

export interface Submission {
  _id: string;
  student_id: string;
  username: string;
  email: string;
  status: SubmissionStatus;
  score: number | null;
  submissionDate: string;
  role?: string;
  profile_url?: string;
}

interface SubmittedTableProps {
  submissions: Submission[];
  onView: (id: string) => void;
  onGrade: (id: string) => void;
  totalScore?: number;
}

const statusColorMap = {
  submitted: 'warning',
  graded: 'success',
  late: 'danger',
  unsubmitted: 'default',
} as const;

export const SubmittedTable = ({ submissions, onView, onGrade, totalScore = 100 }: SubmittedTableProps) => {
  const columns = [
    { name: 'LEARNER', uid: 'name' },
    { name: 'STATUS', uid: 'status' },
    { name: 'SCORE', uid: 'score' },
    { name: 'SUBMISSION TIME', uid: 'submissionDate' },
    { name: 'ACTIONS', uid: 'actions' },
  ];

  const renderCell = (submission: Submission, columnKey: React.Key) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <img
              src={submission.profile_url || `https://i.pravatar.cc/150?u=${submission._id}`}
              alt={submission.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{submission.username}</p>
              <p className="text-xs text-gray-500">{submission.email}</p>
            </div>
          </div>
        );
      case 'status':
        return (
          <Chip 
            className="capitalize" 
            color={statusColorMap[submission.status]}
            size="sm"
            variant="flat"
          >
            {submission.status}
          </Chip>
        );
      case 'score':
        if (submission.status === 'unsubmitted') {
          return (
            <span className="text-default-400 italic">No submission</span>
          );
        }
        return submission.score !== null ? `${submission.score}/${totalScore}` : 'Not graded';
      case 'actions':
        if (submission.status === 'unsubmitted') {
          return (
            <div className="flex gap-2">
              <span className="text-sm text-default-400 italic px-3 py-1">No actions available</span>
            </div>
          );
        }
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="flat" 
              color="primary"
              onPress={() => onView(submission._id)}
            >
              View
            </Button>
            <Button 
              size="sm" 
              variant="flat" 
              color="success"
              isDisabled={submission.status !== 'submitted'}
              onPress={() => onGrade(submission._id)}
            >
              Grade
            </Button>
          </div>
        );
      default:
        return submission[columnKey as keyof Submission];
    }
  };

  return (
    <Table aria-label="Exam submissions table" className="w-full">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn 
            key={column.uid} 
            align={column.uid === 'actions' ? 'center' : 'start'}
            className="text-sm font-medium text-gray-600"
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={submissions}>
        {(item) => (
          <TableRow key={item._id}>
            {(columnKey) => (
              <TableCell>
                {renderCell(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
