import { Card, CardBody, CardFooter, CardHeader, Image, CardProps, Chip, Button, Tooltip } from '@nextui-org/react'
import React from 'react'
import { FaGroup, FluentArrowRight12Filled, FluentSettings16Filled, HealthiconsIExamMultipleChoice, PhStudentFill } from './icons/icons'

type Props = {
  title: string
  description: string
  examCount: number
  groupCount: number
  studentCount: number
} & CardProps

const CourseCard = (props: Props) => {
  const coverAddress = 'https://img.freepik.com/free-psd/3d-illustration-nocturnal-person-staying-up_23-2150944847.jpg?t=st=1729758457~exp=1729762057~hmac=df0b032ff22d3c02c2b0cb2f7d53fa07236e2c04cf30a9df498fb91df6c46c10&w=1060'
  return (
    <Card className={props.className + ' transition duration-500 hover:-translate-y-3 '}>
      <CardHeader className='p-0 rounded-b-none'>
        <Image className='min-w-full rounded-b-none' src={coverAddress} height={150} alt='course cover' />
      </CardHeader>
      <CardBody>
        <div>
          <h1 className='font-bold'>{props.title}</h1>
          <p className='text-sm text-white/50'>{props.description}</p>
        </div>
      </CardBody>
      <CardFooter className='justify-between'>
        <div className='flex gap-x-2'>
          <Tooltip content={`Examinations: ${props.examCount}`}>
            <Button variant='flat' radius='full' className='cursor-default' startContent={<HealthiconsIExamMultipleChoice />} size='sm' isIconOnly />
          </Tooltip>
          <Tooltip content={`Groups: ${props.groupCount}`}>
            <Button variant='flat' radius='full' className='cursor-default' startContent={<FaGroup />} size='sm' isIconOnly />
          </Tooltip>
          <Tooltip content={`Students: ${props.studentCount}`}>
            <Button variant='flat' radius='full' className='cursor-default' startContent={<PhStudentFill />} size='sm' isIconOnly />
          </Tooltip>
        </div>
        <div className='flex gap-x-2'>
          <Button startContent={<FluentSettings16Filled />} className='text-2xl' variant='light' color='primary' size='sm' isIconOnly></Button>
          <Button startContent={<FluentArrowRight12Filled />} variant='faded' color='primary' size='sm' isIconOnly></Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CourseCard