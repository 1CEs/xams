"use client"

import { Navbar as Nav, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Avatar, Badge, Popover, PopoverTrigger, PopoverContent, Divider, Spinner } from '@nextui-org/react'
import { useRouter } from 'nextjs-toploader/app'
import { useCookies } from 'next-client-cookies'
import { useUserStore } from '@/stores/user.store'
import { useEffect, useState } from 'react'
import { Fa6SolidBell, FluentSettings16Filled } from './icons/icons'
import { isAxiosError } from 'axios'
import { usePathname } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'

const Navbar = () => {
    const [signedIn, setSignedIn] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [contentLoading, setContentLoading] = useState<boolean>(true)
    const pathName = usePathname()
    const router = useRouter()
    const { user, setUser } = useUserStore()
    const cookies = useCookies()

    useEffect(() => {
        const getUser = cookies.get('user')
        setSignedIn(getUser ? true : false)
        setContentLoading(false)
    }, [])

    useEffect(() => {
        const getUser = cookies.get('user')
        setSignedIn(getUser ? true : false)
        setContentLoading(false)
    }, [pathName])


    const onLogout = async () => {
        try {
            setLoading(true)
            const res = await clientAPI.post('/auth/logout', null, {
                withCredentials: true
            })
            console.log(res)
            cookies.remove('user')
            router.push('/')
            setUser(null)
            setSignedIn(false)
            setLoading(false)
        } catch (error) {
            if (isAxiosError(error)) console.log(error.response?.data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Nav position="sticky" className="border-b border-secondary">
            <NavbarBrand onClick={() => router.push('/')} className='cursor-pointer'>
                <p className="font-bold hero-foreground">XAMS</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Explores
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link href="/overview" color='secondary' aria-current="page">
                        Overview
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {(pathName !== '/member/sign-up' && pathName !== '/member/sign-in') ? (
                contentLoading ? (
                    <NavbarContent justify="end">
                        <NavbarItem>
                            <Spinner />
                        </NavbarItem>
                    </NavbarContent>
                ) : !signedIn ? (
                    <NavbarContent justify="end">
                        <NavbarItem>
                            <Button
                                isLoading={loading}
                                onPress={() => router.push('/member/sign-in')}
                                className="text-primary"
                                color="primary"
                                variant="flat"
                            >
                                {!loading && 'Sign In'}
                            </Button>
                        </NavbarItem>
                    </NavbarContent>
                ) : (
                    <NavbarContent justify="end">
                        <NavbarItem>
                            <Button isIconOnly className="text-lg" variant="light">
                                <Badge size="sm" content="5" color="primary" className="text-background">
                                    <Fa6SolidBell />
                                </Badge>
                            </Button>
                        </NavbarItem>
                        <NavbarItem>
                            <Popover showArrow placement="bottom">
                                <PopoverTrigger>
                                    <Avatar
                                        className="cursor-pointer"
                                        size="sm"
                                        isBordered
                                        color="primary"
                                        src={user?.profile_url}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-4 backdrop-blur-md gap-y-3 mt-4">
                                    <div className="flex gap-x-14">
                                        <div className="flex gap-x-4 items-center">
                                            <Avatar size="sm" isBordered color="primary" src={user?.profile_url} />
                                            <div className="flex flex-col">
                                                <h1 className="text-primary font-bold">{user?.username}</h1>
                                                <h2 className="text-foreground/60">{user?.role}</h2>
                                            </div>
                                        </div>
                                        <Button variant="light" className="text-2xl text-foreground/60 hover:text-foreground" isIconOnly>
                                            <FluentSettings16Filled />
                                        </Button>
                                    </div>
                                    <Divider />
                                    <Button onPress={onLogout} color="danger" className="w-full font-bold" size="sm">
                                        Sign out
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </NavbarItem>
                    </NavbarContent>
                )
            ) : <NavbarContent></NavbarContent>}
        </Nav>
    )
}

export default Navbar