"use client"

import { Navbar as Nav, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Avatar, Badge, Popover, PopoverTrigger, PopoverContent, Divider, Spinner } from '@nextui-org/react'
import { useRouter } from 'nextjs-toploader/app'
import { useCookies } from 'next-client-cookies'
import { useUserStore } from '@/stores/user.store'
import { useEffect, useState } from 'react'
import { FluentSettings16Filled } from './icons/icons'
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
        <Nav 
            position="sticky" 
            className="border-b border-secondary px-2 sm:px-4 lg:px-6"
            maxWidth="full"
            height="4rem"
        >
            <NavbarBrand onClick={() => router.push('/')} className='cursor-pointer'>
                <p className="font-bold hero-foreground text-lg sm:text-xl">XAMS</p>
            </NavbarBrand>
            
            {/* Desktop Navigation */}
            <NavbarContent className="hidden md:flex gap-2 lg:gap-4" justify="center">
                <NavbarItem isActive={pathName === '/explore'}>
                    <Link 
                        color={pathName === '/explore' ? 'secondary' : 'foreground'} 
                        href="/explore"
                        className="text-sm lg:text-base font-medium hover:text-secondary transition-colors"
                    >
                        Explores
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={pathName === '/overview'}>
                    <Link 
                        color={pathName === '/overview' ? 'secondary' : 'foreground'} 
                        href="/overview"
                        className="text-sm lg:text-base font-medium hover:text-secondary transition-colors"
                    >
                        Overview
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={pathName === '/annoucement'}>
                    <Link 
                        color={pathName === '/annoucement' ? 'secondary' : 'foreground'} 
                        href="/annoucement"
                        className="text-sm lg:text-base font-medium hover:text-secondary transition-colors"
                    >
                        Annoucement
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* User Actions */}
            {(pathName !== '/member/sign-up' && pathName !== '/member/sign-in') ? (
                contentLoading ? (
                    <NavbarContent justify="end" className="gap-2">
                        <NavbarItem>
                            <Spinner size="sm" />
                        </NavbarItem>
                    </NavbarContent>
                ) : !signedIn ? (
                    <NavbarContent justify="end" className="gap-2">
                        <NavbarItem>
                            <Button
                                isLoading={loading}
                                onPress={() => router.push('/member/sign-in')}
                                className="text-primary"
                                color="primary"
                                variant="flat"
                                size="sm"
                            >
                                {!loading && 'Sign In'}
                            </Button>
                        </NavbarItem>
                    </NavbarContent>
                ) : (
                    <NavbarContent justify="end" className="gap-2">
                        {/* Mobile Navigation Menu - Only show on small screens when signed in */}
                        <NavbarItem className="md:hidden">
                            <Popover showArrow placement="bottom-end">
                                <PopoverTrigger>
                                    <Button
                                        variant="light"
                                        isIconOnly
                                        size="sm"
                                        className="text-foreground"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-3 backdrop-blur-md gap-y-2 min-w-[200px]">
                                    <div className="flex flex-col gap-2">
                                        <Link 
                                            href="/explore" 
                                            className={`p-2 rounded-md text-sm font-medium transition-colors ${
                                                pathName === '/explore' ? 'text-secondary bg-secondary/10' : 'text-foreground hover:text-secondary'
                                            }`}
                                        >
                                            Explores
                                        </Link>
                                        <Link 
                                            href="/overview" 
                                            className={`p-2 rounded-md text-sm font-medium transition-colors ${
                                                pathName === '/overview' ? 'text-secondary bg-secondary/10' : 'text-foreground hover:text-secondary'
                                            }`}
                                        >
                                            Overview
                                        </Link>
                                        <Link 
                                            href="/annoucement" 
                                            className={`p-2 rounded-md text-sm font-medium transition-colors ${
                                                pathName === '/annoucement' ? 'text-secondary bg-secondary/10' : 'text-foreground hover:text-secondary'
                                            }`}
                                        >
                                            Annoucement
                                        </Link>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </NavbarItem>
                        
                        {/* User Profile */}
                        <NavbarItem>
                            <Popover showArrow placement="bottom-end">
                                <PopoverTrigger>
                                    <Avatar
                                        className="cursor-pointer"
                                        size="sm"
                                        isBordered
                                        color="primary"
                                        src={user?.profile_url}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-4 backdrop-blur-md gap-y-3">
                                    <div className="flex gap-x-4 sm:gap-x-6 lg:gap-x-8">
                                        <div className="flex gap-x-3 sm:gap-x-4 items-center flex-1">
                                            <Avatar size="sm" isBordered color="primary" src={user?.profile_url} />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <h1 className="text-primary font-bold text-sm sm:text-base truncate">{user?.username}</h1>
                                                <h2 className="text-foreground/60 text-xs sm:text-sm capitalize">{user?.role}</h2>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="light" 
                                            className="text-lg sm:text-xl text-foreground/60 hover:text-foreground" 
                                            isIconOnly
                                            size="sm"
                                        >
                                            <Link href="/settings">
                                                <FluentSettings16Filled />
                                            </Link>
                                        </Button>
                                    </div>
                                    <Divider />
                                    <Button 
                                        onPress={onLogout} 
                                        color="danger" 
                                        className="w-full font-bold" 
                                        size="sm"
                                        isLoading={loading}
                                    >
                                        {!loading && 'Sign out'}
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </NavbarItem>
                    </NavbarContent>
                )
            ) : (
                <NavbarContent justify="end">
                    <NavbarItem></NavbarItem>
                </NavbarContent>
            )}
        </Nav>
    )
}

export default Navbar
