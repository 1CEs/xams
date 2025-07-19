"use client"
import { IconoirSort, MdiSearch } from "@/components/icons/icons";
import CourseList from "@/components/overview/course-list";
import CreateAction from "@/components/overview/create-action";
import ExamList from "@/components/overview/exam-list";
import { Card, CardBody, Select, SelectItem, Tab, Tabs } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import BankList from "@/components/overview/bank-list";

export default function InstructorOverview() {
    return (
        <div className="grid grid-cols-7">
            <div className="col-span-2 max-h-fit flex flex-col gap-y-4">
                <Card>
                    <CardBody className="grid grid-cols-3 gap-2">
                        <Input className="col-span-2" placeholder="Enter name" endContent={<MdiSearch fontSize={24} />} />
                        <Select startContent={<IconoirSort fontSize={24} />}>
                            <SelectItem key={'xdsadasd'}>Something</SelectItem>
                        </Select>
                    </CardBody>
                </Card>
                <Card >
                    <CardBody className="h-fit">
                        <CreateAction />
                    </CardBody>
                </Card>
                
            </div>
            <div className="col-span-5">
                <Tabs className="flex justify-center pb-3">
                    <Tab key='course' title='Course'>
                        <CourseList />
                    </Tab>
                    <Tab key='examination' title='Examination'>
                        <ExamList />
                    </Tab>
                    <Tab key='bank' title='Bank'>
                        <BankList />
                    </Tab>
                </Tabs>
                
            </div>
            
        </div>
    )
}