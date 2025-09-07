import { Button, Card, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'

interface ExamResult {
  totalScore: number
  obtainedScore: number
  correctAnswers: number
  totalQuestions: number
  details: {
    questionId: string
    isCorrect: boolean
    userAnswer: string[]
    correctAnswer: string[]
    score: number
    obtainedScore: number
  }[]
}

interface ExamResultsModalProps {
  isOpen: boolean
  onClose: () => void
  examResult: ExamResult | null
  questions: any[]
  questionsPerPage: number
  setCurrentPage: (page: number) => void
}

const ExamResultsModal = ({
  isOpen,
  onClose,
  examResult,
  questions,
  questionsPerPage,
  setCurrentPage
}: ExamResultsModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Exam Results</h2>
          <p className="text-sm text-foreground/50">Your examination has been submitted successfully</p>
        </ModalHeader>
        <ModalBody>
          {examResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-foreground/50">Total Score</p>
                  <p className="text-2xl font-bold">{examResult.obtainedScore}/{examResult.totalScore}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-foreground/50">Correct Answers</p>
                  <p className="text-2xl font-bold">{examResult.correctAnswers}/{examResult.totalQuestions}</p>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Question Details</h3>
                <div className="grid grid-cols-5 gap-2">
                  {examResult.details.map((detail, index) => (
                    <Card
                      key={detail.questionId}
                      className={`p-2 ${detail.isCorrect ? 'border-success' : 'border-danger'} h-24 flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => {
                        const questionIndex = questions.findIndex(q => q._id === detail.questionId) || 0
                        const page = Math.floor(questionIndex / questionsPerPage) + 1
                        setCurrentPage(page)
                        onClose()
                        setTimeout(() => {
                          const questionElement = document.getElementById(`question-${questionIndex % questionsPerPage}`)
                          if (questionElement) {
                            questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }, 100)
                      }}
                    >
                      <div className="text-center">
                        <p className="font-medium text-sm">Q{index + 1}</p>
                        <p className={`text-md ${detail.isCorrect ? 'text-success' : 'text-danger'}`}>
                          {detail.isCorrect ? '✓' : '✗'}
                        </p>
                        <p className="text-xs text-foreground/50">{detail.obtainedScore}/{detail.score}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ExamResultsModal 