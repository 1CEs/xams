import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Card, CardBody, CardHeader, Divider, Chip, Tooltip, useDisclosure, Textarea, Radio, RadioGroup, Checkbox } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { FeEdit, MdiBin, MingcuteAddFill } from "@/components/icons/icons";
import TextEditor from "@/components/text-editor";
import { useTrigger } from "@/stores/trigger.store";

interface Choice {
    content: string;
    isCorrect: boolean;
    score: number;
}

interface SubQuestion {
    _id?: string;
    question: string;
    type: 'mc' | 'tf' | 'ses' | 'les';
    score: number;
    choices?: Choice[];
    isRandomChoices?: boolean;
    isTrue?: boolean;
    expectedAnswers?: string[];
}

interface NestedQuestion {
    _id?: string;
    question: string;
    type: 'nested';
    score: number;
    questions?: SubQuestion[];
}

interface EditNestedQuestionModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    nestedQuestion: any | null; // Using any to be compatible with QuestionWithIdentifier<QuestionForm>
    examinationId: string;
}

const EditNestedQuestionModal = ({ 
    isOpen, 
    onOpenChange, 
    nestedQuestion, 
    examinationId 
}: EditNestedQuestionModalProps) => {
    const { trigger, setTrigger } = useTrigger();
    const [isLoading, setIsLoading] = useState(false);
    const [nestedQuestionData, setNestedQuestionData] = useState({
        question: '',
        score: 0
    });
    const [editingSubQuestion, setEditingSubQuestion] = useState<SubQuestion | null>(null);
    const { isOpen: isSubQuestionModalOpen, onOpen: onSubQuestionModalOpen, onOpenChange: onSubQuestionModalOpenChange } = useDisclosure();

    useEffect(() => {
        if (nestedQuestion) {
            setNestedQuestionData({
                question: nestedQuestion.question,
                score: nestedQuestion.score
            });
        }
    }, [nestedQuestion]);

    const handleSaveNestedQuestion = async () => {
        if (!nestedQuestion?._id) return;
        
        try {
            setIsLoading(true);
            await clientAPI.put(`/exam/nested-question/${examinationId}/${nestedQuestion._id}`, nestedQuestionData);
            toast.success('Nested question updated successfully');
            setTrigger(!trigger);
            onOpenChange();
        } catch (error) {
            errorHandler(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubQuestion = (subQuestion: SubQuestion) => {
        setEditingSubQuestion(subQuestion);
        onSubQuestionModalOpen();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "mc": return "primary";
            case "tf": return "success";
            case "ses": return "warning";
            case "les": return "secondary";
            default: return "default";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "mc": return "Multiple Choice";
            case "tf": return "True/False";
            case "ses": return "Short Essay";
            case "les": return "Long Essay";
            default: return type;
        }
    };

    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
                size="4xl"
                scrollBehavior="inside"
                classNames={{
                    base: "max-h-[90vh]",
                    body: "py-6",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold">Edit Nested Question</h2>
                        <p className="text-sm text-default-500">Update the nested question context and manage sub-questions</p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            {/* Nested Question Context */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Question Context</h3>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Question Text</label>
                                        <Textarea
                                            value={nestedQuestionData.question}
                                            onChange={(e) => setNestedQuestionData(prev => ({ ...prev, question: e.target.value }))}
                                            placeholder="Enter the main question or context for the nested questions"
                                            minRows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Total Score</label>
                                        <Input
                                            type="number"
                                            value={nestedQuestionData.score.toString()}
                                            onChange={(e) => setNestedQuestionData(prev => ({ ...prev, score: Number(e.target.value) }))}
                                            placeholder="Enter total score"
                                            min="0"
                                        />
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Sub-Questions */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Sub-Questions</h3>
                                </CardHeader>
                                <CardBody>
                                    {nestedQuestion?.questions && nestedQuestion.questions.length > 0 ? (
                                        <div className="space-y-4">
                                            {nestedQuestion.questions.map((subQuestion: SubQuestion, index: number) => (
                                                <Card key={index} className="shadow-sm">
                                                    <CardBody className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Chip
                                                                        size="sm"
                                                                        color={getTypeColor(subQuestion.type)}
                                                                        variant="flat"
                                                                    >
                                                                        {getTypeLabel(subQuestion.type)}
                                                                    </Chip>
                                                                    <Chip
                                                                        size="sm"
                                                                        color="default"
                                                                        variant="flat"
                                                                    >
                                                                        Score: {subQuestion.score}
                                                                    </Chip>
                                                                </div>
                                                                <div 
                                                                    className="text-sm mb-2" 
                                                                    dangerouslySetInnerHTML={{ __html: subQuestion.question.substring(0, 100) + (subQuestion.question.length > 100 ? '...' : '') }} 
                                                                />
                                                                
                                                                {/* Show choices preview for MC questions */}
                                                                {subQuestion.type === 'mc' && subQuestion.choices && (
                                                                    <div className="mt-2">
                                                                        <p className="text-xs text-gray-500 mb-1">Choices:</p>
                                                                        {subQuestion.choices.slice(0, 2).map((choice, choiceIndex) => (
                                                                            <div key={choiceIndex} className="flex items-center gap-2 mb-1">
                                                                                <div className={`w-2 h-2 rounded-full ${choice.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                                                <span className="text-xs text-gray-600">{choice.content.substring(0, 50)}...</span>
                                                                            </div>
                                                                        ))}
                                                                        {subQuestion.choices.length > 2 && (
                                                                            <p className="text-xs text-gray-400">...and {subQuestion.choices.length - 2} more</p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Show correct answer for TF questions */}
                                                                {subQuestion.type === 'tf' && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Correct Answer: {subQuestion.isTrue ? 'True' : 'False'}
                                                                    </p>
                                                                )}

                                                                {/* Show expected answers for essay questions */}
                                                                {(subQuestion.type === 'ses' || subQuestion.type === 'les') && subQuestion.expectedAnswers && (
                                                                    <div className="mt-2">
                                                                        <p className="text-xs text-gray-500 mb-1">Expected Answers:</p>
                                                                        {subQuestion.expectedAnswers.slice(0, 2).map((answer, answerIndex) => (
                                                                            <p key={answerIndex} className="text-xs text-gray-600">
                                                                                {answerIndex + 1}. {answer.substring(0, 50)}...
                                                                            </p>
                                                                        ))}
                                                                        {subQuestion.expectedAnswers.length > 2 && (
                                                                            <p className="text-xs text-gray-400">...and {subQuestion.expectedAnswers.length - 2} more</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Tooltip content="Edit sub-question">
                                                                <Button
                                                                    size="sm"
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    color="primary"
                                                                    onPress={() => handleEditSubQuestion(subQuestion)}
                                                                >
                                                                    <FeEdit fontSize={14} />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">No sub-questions found</p>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onOpenChange}>
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleSaveNestedQuestion}
                            isLoading={isLoading}
                            startContent={!isLoading ? <MingcuteAddFill /> : null}
                        >
                            Save Changes
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Sub-Question Edit Modal */}
            <SubQuestionEditModal
                isOpen={isSubQuestionModalOpen}
                onOpenChange={onSubQuestionModalOpenChange}
                subQuestion={editingSubQuestion}
                nestedQuestionId={nestedQuestion?._id || ''}
                examinationId={examinationId}
                onSave={() => {
                    setTrigger(!trigger);
                    onSubQuestionModalOpenChange();
                }}
            />
        </>
    );
};

// Sub-Question Edit Modal Component
interface SubQuestionEditModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    subQuestion: SubQuestion | null;
    nestedQuestionId: string;
    examinationId: string;
    onSave: () => void;
}

const SubQuestionEditModal = ({ 
    isOpen, 
    onOpenChange, 
    subQuestion, 
    nestedQuestionId, 
    examinationId, 
    onSave 
}: SubQuestionEditModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SubQuestion>>({
        question: '',
        type: 'mc',
        score: 1,
        choices: [
            { content: '', isCorrect: false, score: 0 },
            { content: '', isCorrect: false, score: 0 }
        ],
        isRandomChoices: true,
        isTrue: false,
        expectedAnswers: ['']
    });

    useEffect(() => {
        if (subQuestion) {
            setFormData({
                question: subQuestion.question,
                type: subQuestion.type,
                score: subQuestion.score,
                choices: subQuestion.choices || [
                    { content: '', isCorrect: false, score: 0 },
                    { content: '', isCorrect: false, score: 0 }
                ],
                isRandomChoices: subQuestion.isRandomChoices ?? true,
                isTrue: subQuestion.isTrue ?? false,
                expectedAnswers: subQuestion.expectedAnswers || ['']
            });
        }
    }, [subQuestion]);

    const handleSave = async () => {
        if (!subQuestion?._id) return;

        try {
            setIsLoading(true);
            await clientAPI.put(`/exam/nested-question/${examinationId}/${nestedQuestionId}/sub-question/${subQuestion._id}`, formData);
            toast.success('Sub-question updated successfully');
            onSave();
        } catch (error) {
            errorHandler(error);
        } finally {
            setIsLoading(false);
        }
    };

    const addChoice = () => {
        setFormData(prev => ({
            ...prev,
            choices: [...(prev.choices || []), { content: '', isCorrect: false, score: 0 }]
        }));
    };

    const removeChoice = (index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: prev.choices?.filter((_, i) => i !== index) || []
        }));
    };

    const updateChoice = (index: number, field: keyof Choice, value: any) => {
        setFormData(prev => ({
            ...prev,
            choices: prev.choices?.map((choice, i) => 
                i === index ? { ...choice, [field]: value } : choice
            ) || []
        }));
    };

    const addExpectedAnswer = () => {
        setFormData(prev => ({
            ...prev,
            expectedAnswers: [...(prev.expectedAnswers || []), '']
        }));
    };

    const removeExpectedAnswer = (index: number) => {
        setFormData(prev => ({
            ...prev,
            expectedAnswers: prev.expectedAnswers?.filter((_, i) => i !== index) || []
        }));
    };

    const updateExpectedAnswer = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            expectedAnswers: prev.expectedAnswers?.map((answer, i) => 
                i === index ? value : answer
            ) || []
        }));
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader>
                    <h2 className="text-xl font-bold">Edit Sub-Question</h2>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        {/* Question Text */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Question</label>
                            <Textarea
                                value={formData.question}
                                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                placeholder="Enter question text"
                                minRows={2}
                            />
                        </div>

                        {/* Question Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Question Type</label>
                            <RadioGroup
                                value={formData.type}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                                orientation="horizontal"
                            >
                                <Radio value="mc">Multiple Choice</Radio>
                                <Radio value="tf">True/False</Radio>
                                <Radio value="ses">Short Essay</Radio>
                                <Radio value="les">Long Essay</Radio>
                            </RadioGroup>
                        </div>

                        {/* Score */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Score</label>
                            <Input
                                type="number"
                                value={formData.score?.toString() || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, score: Number(e.target.value) }))}
                                min="0"
                                max="100"
                            />
                        </div>

                        {/* Multiple Choice Options */}
                        {formData.type === 'mc' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Choices</label>
                                <div className="space-y-2">
                                    {formData.choices?.map((choice, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Checkbox
                                                isSelected={choice.isCorrect}
                                                onValueChange={(checked) => updateChoice(index, 'isCorrect', checked)}
                                            />
                                            <Input
                                                value={choice.content}
                                                onChange={(e) => updateChoice(index, 'content', e.target.value)}
                                                placeholder={`Choice ${index + 1}`}
                                                className="flex-1"
                                            />
                                            {(formData.choices?.length || 0) > 2 && (
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => removeChoice(index)}
                                                >
                                                    <MdiBin />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="light"
                                        onPress={addChoice}
                                    >
                                        Add Choice
                                    </Button>
                                </div>
                                <div className="mt-2">
                                    <Checkbox
                                        isSelected={formData.isRandomChoices}
                                        onValueChange={(checked) => setFormData(prev => ({ ...prev, isRandomChoices: checked }))}
                                    >
                                        Randomize choice order
                                    </Checkbox>
                                </div>
                            </div>
                        )}

                        {/* True/False Options */}
                        {formData.type === 'tf' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Correct Answer</label>
                                <RadioGroup
                                    value={formData.isTrue ? 'true' : 'false'}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, isTrue: value === 'true' }))}
                                    orientation="horizontal"
                                >
                                    <Radio value="true">True</Radio>
                                    <Radio value="false">False</Radio>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Essay Expected Answers */}
                        {(formData.type === 'ses' || formData.type === 'les') && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Expected Answers</label>
                                <div className="space-y-2">
                                    {formData.expectedAnswers?.map((answer, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                value={answer}
                                                onChange={(e) => updateExpectedAnswer(index, e.target.value)}
                                                placeholder={`Expected answer ${index + 1}`}
                                                className="flex-1"
                                            />
                                            {(formData.expectedAnswers?.length || 0) > 1 && (
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => removeExpectedAnswer(index)}
                                                >
                                                    <MdiBin />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="light"
                                        onPress={addExpectedAnswer}
                                    >
                                        Add Expected Answer
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onOpenChange}>
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSave}
                        isLoading={isLoading}
                    >
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditNestedQuestionModal;
