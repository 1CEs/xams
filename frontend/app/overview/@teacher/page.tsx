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
        <div className="flex flex-col lg:grid lg:grid-cols-7 gap-4 p-4 min-h-screen">
            {/* Sidebar - Search and Actions */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Search and Filter Card */}
                <Card className="w-full">
                    <CardBody className="flex flex-col sm:grid sm:grid-cols-3 gap-2 p-4">
                        <Input 
                            className="sm:col-span-2" 
                            placeholder="Enter name" 
                            endContent={<MdiSearch fontSize={24} />}
                            size="sm"
                        />
                        <Select 
                            startContent={<IconoirSort fontSize={24} />}
                            size="sm"
                            placeholder="Sort by"
                        >
                            <SelectItem key={'recent'}>Recent</SelectItem>
                            <SelectItem key={'name'}>Name</SelectItem>
                            <SelectItem key={'date'}>Date</SelectItem>
                        </Select>
                    </CardBody>
                </Card>
                
                {/* Create Actions Card */}
                <Card className="w-full">
                    <CardBody className="p-4">
                        <CreateAction />
                    </CardBody>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-5 flex-1">
                <div className="w-full">
                    <Tabs 
                        className="flex justify-center pb-3" 
                        variant="underlined"
                        classNames={{
                            tabList: "w-full flex-wrap sm:flex-nowrap gap-2 sm:gap-6",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-2 sm:px-4 h-10 sm:h-12 text-sm sm:text-base",
                            tabContent: "group-data-[selected=true]:text-primary"
                        }}
                    >
                        <Tab key='course' title='Courses'>
                            <div className="mt-4">
                                <CourseList />
                            </div>
                        </Tab>
                        <Tab key='examination' title='Examinations'>
                            <div className="mt-4">
                                <ExamList />
                            </div>
                        </Tab>
                        <Tab key='bank' title='Question Banks'>
                            <div className="mt-4">
                                <BankList />
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}