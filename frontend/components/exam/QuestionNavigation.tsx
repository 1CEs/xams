import { Button, Card, CardBody } from '@nextui-org/react'

interface QuestionNavigationProps {
  questions: Question[]
  currentPage: number
  questionsPerPage: number
  timeRemaining: number
  isQuestionAnswered: (questionId: string) => boolean
  handleQuestionNavigation: (index: number, questionId: string) => void
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
  let totalQuestionCount = 0
  const totalQuestions = questions.length

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
              console.log(currentPage)
              
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
          <p className="text-sm text-foreground/50">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

export default QuestionNavigation 