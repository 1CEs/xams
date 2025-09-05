"use client"

import React from 'react'
import { Card, CardBody, CardHeader, Image, Button, Link } from '@nextui-org/react'
import fullLogo from '@/public/images/logo/full-logo.png'
import { useSearchParams } from 'next/navigation'

const BannedForm = () => {
    const searchParams = useSearchParams()
    const banUntil = searchParams.get('banUntil')
    const banReason = searchParams.get('banReason')
    const isPermanent = searchParams.get('permanent') === 'true'

    const formatBanDate = (dateString: string | null) => {
        if (!dateString) return null
        try {
            return new Date(dateString).toLocaleDateString()
        } catch {
            return null
        }
    }

    return (
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
            <Card>
                <CardHeader className='justify-center flex-col'>
                    <Image src={fullLogo.src} width={200} fallbackSrc="https://placehold.co/500x400/353535/FFFFFF/webp?text=Loading"/>
                    <p>きょういくざむす</p>
                </CardHeader>
                <CardBody className='flex-col gap-y-4 text-center'>
                    <div className="flex flex-col gap-y-3">
                        <h2 className="text-xl font-bold text-danger">Account Suspended</h2>
                        
                        <div className="text-white/80">
                            {isPermanent ? (
                                <p>Your account has been permanently suspended.</p>
                            ) : banUntil ? (
                                <p>Your account is suspended until <span className="font-semibold">{formatBanDate(banUntil)}</span>.</p>
                            ) : (
                                <p>Your account has been suspended.</p>
                            )}
                        </div>

                        {banReason && (
                            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                                <p className="text-sm text-white/70">
                                    <span className="font-semibold">Reason:</span> {banReason}
                                </p>
                            </div>
                        )}

                        <div className="text-sm text-white/60 mt-4">
                            <p>If you believe this is an error, please contact our support team for assistance.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-y-3 mt-6">
                        <Link href="/contact" className="w-full">
                            <Button className="w-full" color="primary" variant="bordered">
                                Contact Support
                            </Button>
                        </Link>
                        
                        <Link href="/member/sign-in" className="w-full">
                            <Button className="w-full" color="default" variant="light">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}

export default BannedForm
