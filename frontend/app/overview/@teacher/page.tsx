"use client"
import { FluentClass24Filled, HealthiconsIExamMultipleChoice, IconoirSort, MaterialSymbolsAssignment, MdiSearch } from "@/components/icons/icons";
import CourseList from "@/components/overview/course-list";
import ExamFormModal from "@/components/overview/exam-form-modal";
import ExamList from "@/components/overview/exam-list";
import { Button, Card, CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Tab, Tabs, useDisclosure } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

export default function InstructorOverview() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const pathName = usePathname()
    const router = useRouter()
    const defaultContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

    return (
        <div className="grid grid-cols-7">
            <div className="col-span-2 max-h-fit flex flex-col gap-y-4">
                <Card>
                    <CardBody className="grid grid-cols-3 gap-2">
                        <Input className="col-span-2" placeholder="Enter name" endContent={<MdiSearch fontSize={24} />} />
                        <Select startContent={<IconoirSort fontSize={24} />}>
                            <SelectItem key={'x'}>Something</SelectItem>
                        </Select>
                    </CardBody>
                </Card>
                <Card >
                    <CardBody className="h-fit">
                        <Dropdown backdrop="opaque">
                            <DropdownTrigger>
                                <Button
                                    variant="light"
                                ><div className="w-full text-start hero-foreground">
                                        Create
                                    </div>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu variant="faded" aria-label="Dropdown menu with description">
                                <DropdownItem
                                    key="new"
                                    startContent={<FluentClass24Filled fontSize={24} />}
                                    description="Create a new course"

                                >
                                    New Course
                                </DropdownItem>
                                <DropdownItem
                                    startContent={<HealthiconsIExamMultipleChoice fontSize={24} />}
                                    key="copy"
                                    description="Create a new examination"
                                    onPress={onOpen}
                                >
                                    New Examination
                                </DropdownItem>
                                <DropdownItem
                                    key="edit"
                                    description="Create a new assignment"
                                    startContent={<MaterialSymbolsAssignment fontSize={24} />}
                                >
                                    New Assignment
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </CardBody>
                </Card>
                <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                    <ExamFormModal />
                </Modal>
            </div>
            <div className="col-span-5">
                <Tabs className="flex justify-center pb-3">
                    <Tab key='course' title='Course'>
                        <CourseList />
                    </Tab>
                    <Tab key='examination' title='Examination'>
                        <ExamList />
                    </Tab>
                </Tabs>
                
            </div>
            
        </div>
    )
}