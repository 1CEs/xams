import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

// Types
export type QuestionType = 'mc' | 'tf' | 'ses' | 'les' | 'nested';

export interface Question {
  _id: string;
  question: string;
  type: QuestionType;
  score: number;
  choices?: {
    content: string;
    isCorrect: boolean;
    score: number;
  }[];
  expectedAnswers?: string[];
  questions?: Question[]; // For nested questions
}

interface QuestionTableProps {
  questions: Question[];
  scheduleId: string;
}

const questionTypeLabels = {
  mc: 'Multiple Choice',
  tf: 'True/False',
  ses: 'Short Essay',
  les: 'Long Essay',
  nested: 'Nested Questions',
} as const;

const questionTypeColors = {
  mc: 'primary',
  tf: 'secondary',
  ses: 'warning',
  les: 'danger',
  nested: 'success',
} as const;

export const QuestionTable = ({ questions, scheduleId }: QuestionTableProps) => {
  const router = useRouter();

  const columns = [
    { name: 'QUESTION', uid: 'question' },
    { name: 'TYPE', uid: 'type' },
    { name: 'SCORE', uid: 'score' },
    { name: 'DETAILS', uid: 'details' },
    { name: 'ACTIONS', uid: 'actions' },
  ];

  const handleViewSubmissions = (questionId: string) => {
    // Navigate to submission history page with question filter
    router.push(`/submission-history?schedule_id=${scheduleId}&question_id=${questionId}`);
  };

  const renderQuestionText = (question: string) => {
    // Strip HTML tags and truncate for display
    const plainText = question.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
  };

  const renderDetails = (question: Question) => {
    switch (question.type) {
      case 'mc':
        const correctChoices = question.choices?.filter(c => c.isCorrect).length || 0;
        const totalChoices = question.choices?.length || 0;
        return (
          <div className="text-sm text-default-600">
            <div>{totalChoices} choices</div>
            <div className="text-success-600">{correctChoices} correct</div>
          </div>
        );
      case 'tf':
        return (
          <div className="text-sm text-default-600">
            True/False question
          </div>
        );
      case 'ses':
        return (
          <div className="text-sm text-default-600">
            <div>{question.expectedAnswers?.length || 0} expected answers</div>
          </div>
        );
      case 'les':
        return (
          <div className="text-sm text-default-600">
            <div>{question.expectedAnswers?.length || 0} expected answers</div>
          </div>
        );
      case 'nested':
        return (
          <div className="text-sm text-default-600">
            <div>{question.questions?.length || 0} sub-questions</div>
          </div>
        );
      default:
        return <div className="text-sm text-default-600">-</div>;
    }
  };

  const renderCell = (question: Question, columnKey: React.Key) => {
    switch (columnKey) {
      case 'question':
        return (
          <div className="max-w-md">
            <p className="font-medium text-sm leading-relaxed">
              {renderQuestionText(question.question)}
            </p>
          </div>
        );
      case 'type':
        return (
          <Chip 
            className="capitalize" 
            color={questionTypeColors[question.type]}
            size="sm"
            variant="flat"
          >
            {questionTypeLabels[question.type]}
          </Chip>
        );
      case 'score':
        return (
          <div className="text-center">
            <span className="font-semibold text-lg">{question.score}</span>
            <span className="text-sm text-default-500 ml-1">pts</span>
          </div>
        );
      case 'details':
        return renderDetails(question);
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="flat" 
              color="primary"
              onPress={() => handleViewSubmissions(question._id)}
            >
              View Submissions
            </Button>
          </div>
        );
      default:
        const value = question[columnKey as keyof Question];
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        }
        return null;
    }
  };

  // Flatten nested questions for display
  const flattenQuestions = (questions: Question[]): Question[] => {
    const flattened: Question[] = [];
    
    questions.forEach(question => {
      if (question.type === 'nested' && question.questions) {
        // Add the nested question container
        flattened.push(question);
        // Add all sub-questions with indentation marker
        question.questions.forEach(subQuestion => {
          flattened.push({
            ...subQuestion,
            question: `└─ ${subQuestion.question}`, // Add visual indentation
          });
        });
      } else {
        flattened.push(question);
      }
    });
    
    return flattened;
  };

  const displayQuestions = flattenQuestions(questions);

  return (
    <div className="space-y-4">
      

      <Table aria-label="Questions table" className="w-full">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.uid} 
              align={column.uid === 'actions' || column.uid === 'score' ? 'center' : 'start'}
              className="text-sm font-medium text-gray-600"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={displayQuestions}>
          {(item) => (
            <TableRow key={`${item._id}-${item.question}`}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
