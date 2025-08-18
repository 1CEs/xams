import { Button, Card, CardBody } from '@nextui-org/react'

interface QuestionNavigationProps {
  questions: Question[]
  currentPage: number
  questionsPerPage: number
  timeRemaining: React.ReactElement
  isQuestionAnswered: (questionId: string) => boolean
  handleQuestionNavigation: (index: number, questionId: string) => void
}

const QuestionNavigation = ({
  questions,
  currentPage,
  questionsPerPage,
  timeRemaining,
  isQuestionAnswered,
  handleQuestionNavigation
}: QuestionNavigationProps) => {
  const totalPages = Math.ceil(questions.length / questionsPerPage)
  const startIndex = (currentPage - 1) * questionsPerPage
  const endIndex = startIndex + questionsPerPage
  let totalQuestionCount = 0
  const totalQuestions = questions.length

  return (
    <Card className='w-full h-fit sticky top-4 sm:top-20'>
      <CardBody className='px-3 sm:px-5'>
        <div className="flex flex-col gap-4">
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2'>
            <h2 className="text-base sm:text-lg font-semibold">Questions Navigation</h2>
            <div className="self-start sm:self-auto">
              {timeRemaining}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const isAnswered = isQuestionAnswered(question._id)
              const isCurrentPage = Math.floor(index / questionsPerPage) + 1 === currentPage
              
              if (question.type === 'nested' && question.questions) {
                return question.questions.map((nestedQuestion, nestedIndex) => {
                  const nestedIsAnswered = isQuestionAnswered(nestedQuestion._id)
                  totalQuestionCount++
                  return (
                    <Button
                      key={nestedQuestion._id}
                      size="sm"
                      color="default"
                      onPress={() => handleQuestionNavigation(index, nestedQuestion._id)}
                      className={`
                        ${!isCurrentPage && nestedIsAnswered ? 'bg-success' : ''}
                        ${!isCurrentPage && !nestedIsAnswered ? 'border-gray-500 border' : ''}
                        ${isCurrentPage ? 'border-success border' : ''}
                        ${isCurrentPage && nestedIsAnswered ? 'bg-success border-secondary border' : ''}
                      `}
                    >
                      {totalQuestionCount}
                    </Button>
                  )
                })
              }
              totalQuestionCount++
              return (
                <Button
                  key={question._id}
                  size="sm"
                  color="default"
                  onPress={() => handleQuestionNavigation(index, question._id)}
                  className={`
                    ${!isCurrentPage && isAnswered ? 'bg-success' : ''}
                    ${!isCurrentPage && !isAnswered ? 'border-gray-500 border' : ''}
                    ${isCurrentPage ? 'border-success border' : ''}
                    ${isCurrentPage && isAnswered ? 'bg-success border-secondary border' : ''}
                  `}
                >
                  {totalQuestionCount}
                </Button>
              )
            })}
          </div>
          <div className="flex justify-between items-center text-sm text-foreground/50">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="hidden sm:inline">Total: {totalQuestions}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default QuestionNavigation 