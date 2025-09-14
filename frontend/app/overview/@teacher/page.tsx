"use client"
import { IconoirSort, MdiSearch } from "@/components/icons/icons";
import CourseList from "@/components/overview/course-list";
import CreateAction from "@/components/overview/create-action";
import { Card, CardBody, Select, SelectItem, Tab, Tabs } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import BankList from "@/components/overview/bank-list";
import { useState } from "react";

export default function InstructorOverview() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [activeTab, setActiveTab] = useState("course");
    return (
        <div className="flex flex-col lg:grid lg:grid-cols-7 gap-4 lg:gap-6">
            <div className="lg:col-span-2 flex flex-col gap-y-3 sm:gap-y-4">
                <Card>
                    <CardBody className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
                        <Input 
                            className="sm:col-span-2" 
                            placeholder={activeTab === "course" ? "Search courses..." : "Search banks..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            endContent={<MdiSearch fontSize={20} className="sm:text-2xl" />}
                            size="sm"
                            classNames={{
                                input: "text-sm sm:text-base",
                                inputWrapper: "h-10 sm:h-12"
                            }}
                        />
                        <Select 
                            startContent={<IconoirSort fontSize={20} className="sm:text-2xl" />}
                            size="sm"
                            placeholder="Sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            classNames={{
                                trigger: "h-10 sm:h-12",
                                value: "text-sm sm:text-base"
                            }}
                        >
                            {activeTab === "course" ? (
                                <>
                                    <SelectItem key="name_asc">Name A-Z</SelectItem>
                                    <SelectItem key="name_desc">Name Z-A</SelectItem>
                                    <SelectItem key="created_newest">Newest First</SelectItem>
                                    <SelectItem key="created_oldest">Oldest First</SelectItem>
                                </>
                            ) : (
                                <>
                                    <SelectItem key="name_asc">Name A-Z</SelectItem>
                                    <SelectItem key="name_desc">Name Z-A</SelectItem>
                                    <SelectItem key="created_newest">Newest First</SelectItem>
                                    <SelectItem key="created_oldest">Oldest First</SelectItem>
                                </>
                            )}
                        </Select>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="h-fit p-3 sm:p-4">
                        <CreateAction />
                    </CardBody>
                </Card>
            </div>
            
            <div className="lg:col-span-5 order-1 lg:order-2">
                <Tabs 
                    className="flex justify-center pb-3" 
                    size="lg"
                    selectedKey={activeTab}
                    onSelectionChange={(key) => {
                        setActiveTab(key as string);
                        setSearchQuery(""); // Clear search when switching tabs
                        setSortBy(""); // Clear sort when switching tabs
                    }}
                    classNames={{
                        tabList: "gap-1 sm:gap-2",
                        tab: "px-3 sm:px-4 py-2 text-sm sm:text-base",
                        tabContent: "text-sm sm:text-base"
                    }}
                >
                    <Tab key='course' title='📚 Course'>
                        <div className="mt-2 sm:mt-4">
                            <CourseList searchQuery={searchQuery} sortBy={sortBy} />
                        </div>
                    </Tab>
                    <Tab key='bank' title='🏦 Bank'>
                        <div className="mt-2 sm:mt-4">
                            <BankList searchQuery={searchQuery} sortBy={sortBy} />
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    )
}