import { Card, CardBody, CardFooter, CardHeader, Image, CardProps, Button, Tooltip, Link, AvatarGroup, Avatar } from '@nextui-org/react'
import React from 'react'
import { FluentSettings16Filled } from './icons/icons'

type CourseCardProps = {
  id: string
  title: string
  description: string
  bgSrc: string
} & CardProps

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, bgSrc, ...props }) => {
  return (
    <Card {...props} className={' transition duration-500 hover:-translate-y-2 '}>
      <CardHeader className='p-0 rounded-b-none'>
        <Card isFooterBlurred className="border-none" radius="lg">
          <Image
            alt="Woman listing to music"
            className="object-cover"
            height={175}
            src={bgSrc}
            width={250}
          />
          <CardFooter className="justify-center before:bg-white/10 border-white/20 border-1 overflow-hidden py-2 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <AvatarGroup max={3} isBordered size='sm'>
              {
                Array.from({ length: Math.random() * 10 + 1 }).map((_, idx: number) => (
                  <Avatar src='https://pic.re/image' key={id} />
                ))
              }
            </AvatarGroup>
          </CardFooter>
        </Card>
      </CardHeader>
      <CardBody>
        <div>
          <h1 className='font-bold'>{title}</h1>
          <p className='text-sm text-white/50'>{description}</p>
        </div>
      </CardBody>
      <CardFooter className='justify-between'>
        <div className='w-full flex items-center gap-x-3'>
          <Button
            className='w-full text-secondary hover:text-white'
            as={Link}
            href={`overview/course?id=${id}`}
            variant='ghost'
            color='secondary'
            size='sm'
          >
            Visit
          </Button>
          <Button size='sm' isIconOnly><FluentSettings16Filled fontSize={20} /></Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CourseCard