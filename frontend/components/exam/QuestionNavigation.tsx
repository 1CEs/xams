import { Button, Card, CardBody } from '@nextui-org/react'

interface QuestionNavigationProps {
  questions: any[]
  currentPage: number
  questionsPerPage: number
  timeRemaining: number
  isQuestionAnswered: (questionId: string) => boolean
  handleQuestionNavigation: (index: number) => void
  formatTime: (seconds: number) => string
}

const QuestionNavigation = ({
  questions,
  currentPage,
  questionsPerPage,
  timeRemaining,
  isQuestionAnswered,
  handleQuestionNavigation,
  formatTime
}: QuestionNavigationProps) => {
  const totalPages = Math.ceil(questions.length / questionsPerPage)
  const startIndex = (currentPage - 1) * questionsPerPage
  const endIndex = startIndex + questionsPerPage

  return (
    <Card className='w-1/3 h-fit sticky top-20'>
      <CardBody className='px-5'>
        <div className="flex flex-col gap-4">
          <div className='flex justify-between items-center'>
            <h2 className="text-lg font-semibold">Questions Navigation</h2>
            <span className={`${timeRemaining <= 300 ? 'text-danger' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {questions.map((question, index) => {
              const isAnswered = isQuestionAnswered(question._id)
              const isCurrentPage = Math.floor(index / questionsPerPage) + 1 === currentPage

              return (
                <Button
                  key={index}
                  size="sm"
                  color="default"
                  onPress={() => handleQuestionNavigation(index)}
                  className={`
                    ${!isCurrentPage && isAnswered ? 'bg-success' : ''}
                    ${!isCurrentPage && !isAnswered ? 'border-gray-500 border' : ''}
                    ${isCurrentPage ? 'border-success border' : ''}
                    ${isCurrentPage && isAnswered ? 'bg-success' : ''}
                  `}
                >
                  {index + 1}
                </Button>
              )
            })}
          </div>
          <p className="text-sm text-foreground/50">
            Page {currentPage} of {totalPages} | Showing questions {startIndex + 1}-{Math.min(endIndex, questions.length)} of {questions.length}
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

export default QuestionNavigation 