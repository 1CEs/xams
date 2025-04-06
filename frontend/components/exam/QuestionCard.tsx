import { Card, CardBody, Checkbox, Radio, RadioGroup, Textarea } from '@nextui-org/react'

interface Choice {
  content: string
  isCorrect: boolean
}

interface Question {
  _id: string
  question: string
  type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  choices?: Choice[]
  isTrue?: boolean
  expectedAnswer?: string
  maxWords?: number
  score: number
  questions?: Question[] // For nested questions
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  answers: any[]
  handleCheckboxChange: (questionId: string, choice: string, isSingleAnswer: boolean) => void
  handleTrueFalseChange: (questionId: string, value: boolean) => void
  handleEssayChange: (questionId: string, value: string) => void
}

const QuestionCard = ({
  question,
  questionNumber,
  answers,
  handleCheckboxChange,
  handleTrueFalseChange,
  handleEssayChange
}: QuestionCardProps) => {
  const renderQuestionContent = (q: Question, isSubQuestion: boolean = false) => {
    return (
      <div className="flex-grow">
        <div className="mb-4 flex justify-between">
          <div>
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
            {q.choices?.filter((c: Choice) => c.isCorrect).length === 1 ? (
              <RadioGroup
                value={answers.find(a => a.questionId === q._id)?.answers[0] || ''}
                onValueChange={(value) => handleCheckboxChange(q._id, value, true)}
                className="flex flex-col space-y-2"
              >
                {q.choices?.map((choice: Choice, choiceIndex: number) => (
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
              q.choices?.map((choice: Choice, choiceIndex: number) => (
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
  }

  return (
    <Card key={question._id} id={`question-${questionNumber}`} className="">
      <CardBody>
        <div className="flex items-start gap-4 px-1">
          <div className={`flex-shrink-0 w-8 h-8 ${question.type === 'nested' ? 'hidden' : ''} rounded-full bg-secondary text-white text-sm flex items-center justify-center`}>
            {questionNumber}
          </div>
          {question.type === 'nested' ? (
            <div className="w-full">
              <div className="mb-4">
                <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: question.question }}></p>
                <p className='text-sm text-foreground/50'>
                  For Question number: {questionNumber} to {questionNumber + (question.questions?.length || 0) - 1}
                </p>
              </div>
              <div className="space-y-6">
                {question.questions?.map((subQuestion, subIndex) => (
                  <div key={subQuestion._id} className="border-l-2 border-secondary pl-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                        {questionNumber + subIndex}
                      </div>
                      <div className="flex-grow">
                        <div className="mb-4 flex justify-between">
                          <div>
                            <p className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: subQuestion.question }}></p>
                            <p className='text-sm text-foreground/50'>
                              {subQuestion.type === 'mc' ? 'Multiple Choice' :
                                subQuestion.type === 'tf' ? 'True/False' :
                                  subQuestion.type === 'ses' ? 'Short Essay' : 'Long Essay'
                              }
                            </p>
                          </div>
                          <p className="text-sm text-foreground/50">Score: {subQuestion.score}</p>
                        </div>

                        {subQuestion.type === 'mc' && (
                          <div className="flex flex-col space-y-2">
                            {subQuestion.choices?.filter((c: Choice) => c.isCorrect).length === 1 ? (
                              <RadioGroup
                                value={answers.find(a => a.questionId === subQuestion._id)?.answers[0] || ''}
                                onValueChange={(value) => handleCheckboxChange(subQuestion._id, value, true)}
                                className="flex flex-col space-y-2"
                              >
                                {subQuestion.choices?.map((choice: Choice, choiceIndex: number) => (
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
                              subQuestion.choices?.map((choice: Choice, choiceIndex: number) => (
                                <div key={choiceIndex} className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                                    {String.fromCharCode(65 + choiceIndex)}
                                  </div>
                                  <Checkbox
                                    isSelected={answers.find(a => a.questionId === subQuestion._id)?.answers.includes(choice.content) || false}
                                    onValueChange={() => handleCheckboxChange(subQuestion._id, choice.content, false)}
                                    className="flex-grow p-3"
                                  >
                                    <span dangerouslySetInnerHTML={{ __html: choice.content }}></span>
                                  </Checkbox>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {subQuestion.type === 'tf' && (
                          <div className="flex flex-col space-y-2">
                            {['True', 'False'].map((option, index) => (
                              <div key={option} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <Checkbox
                                  isSelected={answers.find(a => a.questionId === subQuestion._id)?.answers.includes(option.toLowerCase()) || false}
                                  onValueChange={() => handleTrueFalseChange(subQuestion._id, option === 'True')}
                                  className="flex-grow p-3 rounded-lg border border-default-200"
                                >
                                  {option}
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        )}

                        {(subQuestion.type === 'ses' || subQuestion.type === 'les') && (
                          <Textarea
                            label="Your Answer"
                            placeholder="Type your answer here..."
                            value={answers.find(a => a.questionId === subQuestion._id)?.essayAnswer || ''}
                            onValueChange={(value) => handleEssayChange(subQuestion._id, value)}
                            minRows={subQuestion.type === 'les' ? 5 : 2}
                            maxRows={subQuestion.type === 'les' ? 10 : 4}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderQuestionContent(question)
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default QuestionCard 