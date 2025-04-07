"use client"

import React from 'react'
import { Card, CardBody, CardHeader, Chip, Divider, Avatar } from '@nextui-org/react'
import { Fa6SolidBell, UisSchedule, MdiPaper } from '@/components/icons/icons'

type Props = {}

// Mock announcement data
const mockAnnouncements = [
  {
    id: 1,
    title: "System Maintenance Notice",
    content: "The platform will undergo scheduled maintenance on March 15, 2024, from 2:00 AM to 4:00 AM UTC. During this time, the system will be temporarily unavailable. Please save your work and plan accordingly.",
    priority: "high",
    date: "2024-03-10",
    admin: {
      name: "John Smith",
      role: "System Administrator",
      avatar: "https://i.pravatar.cc/150?u=john"
    }
  },
  {
    id: 2,
    title: "New Feature Release",
    content: "We're excited to announce the release of our new course analytics dashboard. This feature will provide detailed insights into student performance and engagement metrics. Training sessions for instructors will be scheduled next week.",
    priority: "normal",
    date: "2024-03-08",
    admin: {
      name: "Sarah Johnson",
      role: "Product Manager",
      avatar: "https://i.pravatar.cc/150?u=sarah"
    }
  },
  {
    id: 3,
    title: "Platform Guidelines Update",
    content: "We've updated our platform guidelines to enhance the learning experience. Key changes include new content submission policies and updated assessment criteria. Please review the updated guidelines in the admin portal.",
    priority: "low",
    date: "2024-03-05",
    admin: {
      name: "Michael Chen",
      role: "Content Manager",
      avatar: "https://i.pravatar.cc/150?u=michael"
    }
  }
]

const AnnoucementPage = (props: Props) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'normal':
        return 'primary'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Fa6SolidBell className="text-3xl text-primary" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              Announcements
            </h1>
            <p className="text-default-500">Important updates from the administration team</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {mockAnnouncements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className="w-full hover:scale-[1.02] transition-transform duration-200 shadow-lg hover:shadow-xl"
              isPressable
            >
              <CardHeader className="flex flex-col gap-2 pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground/90">{announcement.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <UisSchedule className="text-default-400" />
                      <p className="text-sm text-default-500">{formatDate(announcement.date)}</p>
                    </div>
                  </div>
                  <Chip 
                    color={getPriorityColor(announcement.priority)}
                    variant="flat"
                    startContent={<MdiPaper className="text-lg" />}
                    className="capitalize"
                  >
                    {announcement.priority}
                  </Chip>
                </div>
              </CardHeader>
              <Divider/>
              <CardBody>
                <div className="flex gap-4 items-start">
                  <Avatar 
                    src={announcement.admin.avatar} 
                    name={announcement.admin.name}
                    className="w-12 h-12"
                  />
                  <div className="flex-1">
                    <div className="mb-2">
                      <p className="font-semibold text-foreground/90">{announcement.admin.name}</p>
                      <p className="text-sm text-default-500">{announcement.admin.role}</p>
                    </div>
                    <p className="text-default-600 leading-relaxed">{announcement.content}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AnnoucementPage