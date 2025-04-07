import { Card, CardBody, Checkbox, Radio, RadioGroup, Textarea, Tooltip } from '@nextui-org/react'
import { useCallback, memo, useMemo, useState, useEffect } from 'react'

interface Choice {
  content: string
  isCorrect: boolean
  score: number
}

interface Question {
  _id: string
  question: string
  type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  isRandomChoices?: boolean
  choices?: Choice[]
  isTrue?: boolean
  expectedAnswer?: string
  maxWords?: number
  score: number
  questions?: Question[] // For nested questions
}

interface Answer {
  questionId: string
  answers: string[]
  essayAnswer?: string
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  answers: Answer[]
  setAnswers: React.Dispatch<React.SetStateAction<Answer[]>>
  examId?: string // Add examId prop to access localStorage
  isNested?: boolean // Flag to indicate if this is a nested question
}

// Component for rendering nested questions
const NestedQuestionCard = memo(({
  question,
  questionNumber,
  answers,
  setAnswers,
  examId
}: QuestionCardProps) => {
  return (
    <div className="w-full">
      <div className="max-w-[90%]">
        <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: question.question }}></p>
        <p className='text-sm text-foreground/50'>
          For Question number: {questionNumber} to {questionNumber + (question.questions?.length || 0) - 1}
        </p>
      </div>
      <div className="space-y-6">
        {question.questions?.map((subQuestion, subIndex) => (
          <div key={subQuestion._id} id={`question-${subQuestion._id}`} className="border-l-2 border-secondary pl-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {questionNumber + subIndex}
              </div>
              <QuestionCard
                question={subQuestion}
                questionNumber={questionNumber + subIndex}
                answers={answers}
                setAnswers={setAnswers}
                examId={examId}
                isNested={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

NestedQuestionCard.displayName = 'NestedQuestionCard';

const QuestionCard = memo(({
  question,
  questionNumber,
  answers,
  setAnswers,
  examId,
  isNested = false
}: QuestionCardProps) => {
  // Add state to store randomized choices
  const [randomizedChoices, setRandomizedChoices] = useState<Choice[] | null>(null);
  
  useEffect(() => {
    if (question.isRandomChoices && question.choices && !randomizedChoices) {
      // Check if randomized choices are already stored in localStorage
      if (examId && typeof window !== 'undefined') {
        const storedRandomizedChoices = localStorage.getItem(`exam_${examId}_randomized_choices_${question._id}`);
        
        if (storedRandomizedChoices) {
          // Use stored randomized choices
          setRandomizedChoices(JSON.parse(storedRandomizedChoices));
        } else {
          // Randomize choices and store in localStorage
          const shuffledChoices = [...question.choices].sort(() => Math.random() - 0.5);
          setRandomizedChoices(shuffledChoices);
          
          // Store in localStorage
          localStorage.setItem(`exam_${examId}_randomized_choices_${question._id}`, JSON.stringify(shuffledChoices));
        }
      } else {
        // Fallback to just randomizing without storing
        setRandomizedChoices([...question.choices].sort(() => Math.random() - 0.5));
      }
    }
  }, [question.isRandomChoices, question.choices, randomizedChoices, question._id, examId]);

  // Handler functions moved from the examination page
  const handleCheckboxChange = useCallback((questionId: string, choice: string, isSingleAnswer: boolean) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const answerIndex = newAnswers.findIndex(a => a.questionId === questionId);
      
      if (answerIndex !== -1) {
        const currentAnswer = newAnswers[answerIndex];
        if (isSingleAnswer) {
          // For single answer, only update if the choice is different
          if (!currentAnswer.answers.includes(choice)) {
            newAnswers[answerIndex] = { ...currentAnswer, answers: [choice] };
          }
        } else {
          // For multiple answers, toggle the choice
          const choiceIndex = currentAnswer.answers.indexOf(choice);
          if (choiceIndex === -1) {
            newAnswers[answerIndex] = { ...currentAnswer, answers: [...currentAnswer.answers, choice] };
          } else {
            newAnswers[answerIndex] = { 
              ...currentAnswer, 
              answers: currentAnswer.answers.filter((_, i) => i !== choiceIndex)
            };
          }
        }
      }
      
      return newAnswers;
    });
  }, [setAnswers]);

  const handleTrueFalseChange = useCallback((questionId: string, value: boolean) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        return { ...answer, answers: [value.toString()] }
      }
      return answer
    }))
  }, [setAnswers]);

  const handleEssayChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        return { ...answer, essayAnswer: value }
      }
      return answer
    }))
  }, [setAnswers]);

  const renderQuestionContent = useCallback((q: Question, isSubQuestion: boolean = false) => {
    // Use the randomized choices if available, otherwise use the original choices
    const displayChoices = q.isRandomChoices && randomizedChoices 
      ? randomizedChoices
      : q.choices

    return (
      <div className="flex-grow">
        <div className="mb-4 flex justify-between">
          <div className='max-w-[90%]'>
            <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: q.question }}></p>
            <p className='text-sm text-foreground/50'>
              {q.type === 'mc' ? 'Multiple Choice' :
                q.type === 'tf' ? 'True/False' :
                  q.type === 'ses' ? 'Short Essay' : 'Long Essay'
              }
            </p>
          </div>
          <p className="text-sm text-foreground/50">Score: {q.score}</p>
        </div>

        {q.type === 'mc' && (
          <div className="flex flex-col space-y-2">
            {displayChoices?.filter((c: Choice) => c.isCorrect).length === 1 ? (
              <RadioGroup
                value={answers.find(a => a.questionId === q._id)?.answers[0] || ''}
                onValueChange={(value) => handleCheckboxChange(q._id, value, true)}
                className="flex flex-col space-y-2"
              >
                {displayChoices?.map((choice: Choice, choiceIndex: number) => (
                  <div key={choiceIndex} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                      {String.fromCharCode(65 + choiceIndex)}
                    </div>
                    <Radio value={choice.content} className="flex-grow p-3">
                      <span dangerouslySetInnerHTML={{ __html: choice.content }}></span>
                    </Radio>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              displayChoices?.map((choice: Choice, choiceIndex: number) => (
                <div key={choiceIndex} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                    {String.fromCharCode(65 + choiceIndex)}
                  </div>
                  <Checkbox
                    isSelected={answers.find(a => a.questionId === q._id)?.answers.includes(choice.content) || false}
                    onValueChange={() => handleCheckboxChange(q._id, choice.content, false)}
                    className="flex-grow p-3"
                  >
                    <span dangerouslySetInnerHTML={{ __html: choice.content }}></span>
                  </Checkbox>
                </div>
              ))
            )}
          </div>
        )}

        {q.type === 'tf' && (
          <div className="flex flex-col space-y-2">
            {['True', 'False'].map((option, index) => (
              <div key={option} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                <Checkbox
                  isSelected={answers.find(a => a.questionId === q._id)?.answers.includes(option.toLowerCase()) || false}
                  onValueChange={() => handleTrueFalseChange(q._id, option === 'True')}
                  className="flex-grow p-3 rounded-lg border border-default-200"
                >
                  {option}
                </Checkbox>
              </div>
            ))}
          </div>
        )}

        {(q.type === 'ses' || q.type === 'les') && (
          <Textarea
            label="Your Answer"
            placeholder="Type your answer here..."
            value={answers.find(a => a.questionId === q._id)?.essayAnswer || ''}
            onValueChange={(value) => handleEssayChange(q._id, value)}
            minRows={q.type === 'les' ? 5 : 2}
            maxRows={q.type === 'les' ? 10 : 4}
          />
        )}
      </div>
    )
  }, [answers, handleCheckboxChange, handleTrueFalseChange, handleEssayChange, randomizedChoices]);

  // Memoize the question content to prevent unnecessary re-renders
  const questionContent = useMemo(() => {
    if (question.type === 'nested') {
      return (
        <NestedQuestionCard
          question={question}
          questionNumber={questionNumber}
          answers={answers}
          setAnswers={setAnswers}
          examId={examId}
        />
      );
    } else {
      return renderQuestionContent(question);
    }
  }, [question, questionNumber, renderQuestionContent, answers, setAnswers, examId]);

  return (
    <Card key={question._id} id={`question-${question._id}`} className={isNested ? "border-l-2 border-secondary pl-4" : ""}>
      <CardBody>
        <div className="flex items-start gap-4 px-1">
          <div className={`flex-shrink-0 w-8 h-8 ${question.type === 'nested' ? 'hidden' : ''} rounded-full bg-secondary text-white text-sm flex items-center justify-center`}>
            {questionNumber}
          </div>
          {questionContent}
        </div>
      </CardBody>
    </Card>
  )
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard 