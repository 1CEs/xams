"use client"

import { FluentSettings16Filled, MdiBin, MingcuteAddFill, UisSchedule } from "@/components/icons/icons"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { useFetch } from "@/hooks/use-fetch"
import { Accordion, AccordionItem, Avatar, AvatarGroup, Button, Calendar, Tab, Tabs, Tooltip } from "@nextui-org/react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { today, getLocalTimeZone } from '@internationalized/date'
import { LearnersTable } from "@/components/course/learner-table"

export default function CoursePage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse>>(`/course/${_id}`)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center size-full">
                <Loading />
            </div>
        )
    }

    if (!data?.data) {
        return (
            <div className="flex justify-center items-center size-full">
                <NotFound content={_id as string} />
            </div>
        )
    }

    return (
        <div className="flex size-full gap-y-8 gap-x-14 px-32">
            <div className="flex flex-col basis-5/6 gap-y-8">
                <Image unoptimized className="h-[24rem] w-full rounded-lg" src={data.data.background_src} width={900} height={600} alt="course background" />
                <Tabs>
                    <Tab title="Examination">
                        <Accordion variant="splitted">
                            {
                                Array.from({ length: Math.random() * 10 + 1 }).map((_, idx: number) => (
                                    <AccordionItem title={`Examination ${idx + 1}`} key={idx}>
                                        <div className="flex p-2 text-tiny text-gray-400 justify-center">
                                            Empty
                                        </div>
                                    </AccordionItem>
                                ))
                            }
                        </Accordion>

                    </Tab>
                    <Tab title="Learners">
                        <LearnersTable />
                    </Tab>
                </Tabs>
            </div>
            <div className="flex flex-col gap-y-6 basis-1/6">
                <AvatarGroup size="md" isBordered max={5}>
                    {
                        Array.from({ length: Math.random() * 10 + 1 }).map(() => (
                            <Avatar src="https://pic.re/image" />
                        ))
                    }
                </AvatarGroup>
                <Accordion className="p-0" isCompact variant="splitted">
                    <AccordionItem
                        startContent={
                            <Button size="sm" variant="light" isIconOnly>
                                <MingcuteAddFill /></Button>
                        }
                        key={1}
                        aria-label="Group"
                        title="Group"
                    >
                        <div className="flex p-2 text-tiny text-gray-400 justify-center">
                            Empty
                        </div>
                    </AccordionItem>
                </Accordion>
                <div className="flex flex-wrap gap-x-2">
                    <Tooltip content="Examination Schedule">
                        <Button color="secondary" isIconOnly>
                            <UisSchedule />
                        </Button>
                    </Tooltip>

                    <Button color="warning" isIconOnly>
                        <FluentSettings16Filled fontSize={24} />
                    </Button>
                    <Button color="danger" isIconOnly>
                        <MdiBin fontSize={24} />
                    </Button>
                </div>
                <Calendar color="secondary" isReadOnly aria-label="Schedule" value={today(getLocalTimeZone())} />
            </div>

        </div>
    )
}