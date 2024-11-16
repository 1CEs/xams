import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Accordion, AccordionItem, Button } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import { MdiPaper } from '../icons/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/stores/user.store'

type Props = {}

const ExamList = (props: Props) => {
    const [exams, setExams] = useState<ExamResponse[]>([])
    const { user } = useUserStore()
    const pathName = usePathname()

    useEffect(() => {
        const getExams = async () => {
            try {
                const res = await clientAPI.get(`exam?instructor_id=${user?._id}`)
                setExams(res.data.data)
                console.log(res.data)
            } catch (error) {
                errorHandler(error)
            }
        }
        getExams()
    }, [])

    return (
        <div className='flex flex-col pl-24'>
            <Accordion variant='splitted'>
                {exams.length > 0 ? (
                    exams.map((exam: ExamResponse) => (
                        <AccordionItem startContent={<MdiPaper fontSize={24}/>} key={exam._id} title={exam.title}>
                            <div className='flex flex-col'>
                                <div className='flex justify-between items-center'>
                                    <h1 className='text-sm text-foreground/50'>Questions: {exam.questions.length} items</h1>
                                    <Button as={Link} href={pathName + '/create/examination?id=' + exam._id} color='warning' size='sm'>Manage</Button>
                                </div>
                                
                            </div>
                        </AccordionItem>
                    ))
                ) : (
                    <AccordionItem title="No exams available">
                        Currently, there are no exams to display.
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    )
}

export default ExamList
