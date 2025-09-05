"use client"

import React from 'react'
import { Card, CardBody, CardHeader, Chip, Divider, Avatar, Button, Link } from '@nextui-org/react'
import { Fa6SolidBell, UisSchedule, MdiPaper } from '@/components/icons/icons'

type Props = {}

const ContactPage = (props: Props) => {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold hero-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-default-500 text-lg max-w-2xl mx-auto">
            We're here to help! Get in touch with us for any questions, support, or feedback about the XAMS platform.
          </p>
          <Divider className="my-8 max-w-md mx-auto" />
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Email Support Card */}
          <Card className="bg-black/20 border-l-4 border-primary hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Fa6SolidBell className="text-2xl text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-semibold text-primary">Email Support</p>
                <p className="text-small text-default-500">Primary contact method</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-600 mb-3">
                For general inquiries, technical support, and feedback.
              </p>
              <Link 
                href="mailto:xams.noreply@gmail.com"
                className="text-primary hover:text-primary-400 font-medium"
              >
                xams.noreply@gmail.com
              </Link>
            </CardBody>
          </Card>

          {/* Response Time Card */}
          <Card className="bg-black/20 border-l-4 border-secondary hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex gap-3">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <UisSchedule className="text-2xl text-secondary" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-semibold text-secondary">Response Time</p>
                <p className="text-small text-default-500">How quickly we respond</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-600 mb-3">
                We typically respond within 24-48 hours during business days.
              </p>
              <Chip size="sm" color="secondary" variant="flat">
                Mon-Fri: 9AM-6PM
              </Chip>
            </CardBody>
          </Card>

          {/* Documentation Card */}
          <Card className="bg-black/20 border-l-4 border-primary hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <MdiPaper className="text-2xl text-primary" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-semibold text-primary">Documentation</p>
                <p className="text-small text-default-500">Self-help resources</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-600 mb-3">
                Check our help documentation for common questions and guides.
              </p>
              <Button 
                as={Link}
                href="/help"
                size="sm"
                color="primary"
                variant="flat"
              >
                View Docs
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Contact Form Section */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-black/20">
            <CardHeader>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Quick Contact
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-default-600 mb-6">
                Need immediate assistance? Send us an email directly or use the button below to open your email client.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  as={Link}
                  href="mailto:xams.noreply@gmail.com?subject=XAMS Support Request"
                  color="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Send Email
                </Button>
                <Button 
                  as={Link}
                  href="mailto:xams.noreply@gmail.com?subject=XAMS Bug Report"
                  color="secondary"
                  variant="bordered"
                  size="lg"
                  className="flex-1"
                >
                  Report Bug
                </Button>
              </div>
              
              <Divider className="my-6" />
              
              <div className="text-center">
                <p className="text-sm text-default-500 mb-2">
                  Before contacting us, please include:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Chip size="sm" variant="flat">Your user role</Chip>
                  <Chip size="sm" variant="flat">Error description</Chip>
                  <Chip size="sm" variant="flat">Browser info</Chip>
                  <Chip size="sm" variant="flat">Steps to reproduce</Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <p className="text-default-500 text-sm">
            XAMS (きょういくざむす) - Exam and Assignment Management System
          </p>
          <p className="text-default-400 text-xs mt-2">
            For the best experience, please provide detailed information in your inquiries.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ContactPage