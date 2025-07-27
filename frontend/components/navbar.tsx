"use client"

import { Navbar as Nav, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Avatar, Badge, Popover, PopoverTrigger, PopoverContent, Divider, Spinner, NavbarMenu, NavbarMenuItem, NavbarMenuToggle } from '@nextui-org/react'
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
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
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

    const menuItems = [
        { name: 'Explores', href: '/explore' },
        { name: 'Overview', href: '/overview' },
        { name: 'Announcement', href: '/annoucement' },
    ];

    return (
        <Nav 
            position="sticky" 
            className="border-b border-secondary" 
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
        >
            {/* Brand */}
            <NavbarBrand onClick={() => router.push('/')} className='cursor-pointer'>
                <p className="font-bold hero-foreground text-lg sm:text-xl">XAMS</p>
            </NavbarBrand>

            {/* Desktop Menu */}
            <NavbarContent className="hidden md:flex gap-4" justify="center">
                <NavbarItem isActive={pathName === '/explore'}>
                    <Link color={pathName === '/explore' ? 'secondary' : 'foreground'} href="/explore">
                        Explores
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={pathName === '/overview'}>
                    <Link color={pathName === '/overview' ? 'secondary' : 'foreground'} href="/overview">
                        Overview
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={pathName === '/annoucement'}>
                    <Link color={pathName === '/annoucement' ? 'secondary' : 'foreground'} href="/annoucement">
                        Announcement
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Menu Toggle & Desktop Actions */}
            {(pathName !== '/member/sign-up' && pathName !== '/member/sign-in') && (
                <NavbarContent justify="end">
                    {/* Mobile menu toggle */}
                    <NavbarItem className="md:hidden">
                        <NavbarMenuToggle
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            className="md:hidden"
                        />
                    </NavbarItem>
                    
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {contentLoading ? (
                            <Spinner size="sm" />
                        ) : !signedIn ? (
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
                        ) : (
                            <>
                                <Button isIconOnly className="text-lg" variant="light" size="sm">
                                    <Badge size="sm" content="5" color="primary" className="text-background">
                                        <Fa6SolidBell />
                                    </Badge>
                                </Button>
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
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex gap-x-4 items-center">
                                                <Avatar size="sm" isBordered color="primary" src={user?.profile_url} />
                                                <div className="flex flex-col">
                                                    <h1 className="text-primary font-bold text-sm">{user?.username}</h1>
                                                    <h2 className="text-foreground/60 text-xs">{user?.role}</h2>
                                                </div>
                                            </div>
                                            <Button variant="light" className="text-xl text-foreground/60 hover:text-foreground" isIconOnly size="sm">
                                                <Link href="/settings">
                                                    <FluentSettings16Filled />
                                                </Link>
                                            </Button>
                                        </div>
                                        <Divider />
                                        <Button onPress={onLogout} color="danger" className="w-full font-bold" size="sm">
                                            Sign out
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </>
                        )}
                    </div>
                </NavbarContent>
            )}

            {/* Mobile Menu */}
            <NavbarMenu className="pt-8">
                {menuItems.map((item, index) => (
                    <NavbarMenuItem key={`${item.name}-${index}`}>
                        <Link
                            color={pathName === item.href ? 'secondary' : 'foreground'}
                            className="w-full text-lg font-medium"
                            href={item.href}
                            onPress={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}
                
                {/* Mobile Actions */}
                {contentLoading ? (
                    <NavbarMenuItem>
                        <div className="flex justify-center py-4">
                            <Spinner size="md" />
                        </div>
                    </NavbarMenuItem>
                ) : !signedIn ? (
                    <NavbarMenuItem>
                        <Button
                            isLoading={loading}
                            onPress={() => {
                                router.push('/member/sign-in');
                                setIsMenuOpen(false);
                            }}
                            className="text-primary w-full mt-4"
                            color="primary"
                            variant="flat"
                        >
                            {!loading && 'Sign In'}
                        </Button>
                    </NavbarMenuItem>
                ) : (
                    <>
                        <NavbarMenuItem>
                            <Divider className="my-4" />
                            <div className="flex items-center gap-3 py-2">
                                <Avatar size="md" isBordered color="primary" src={user?.profile_url} />
                                <div>
                                    <p className="text-primary font-bold">{user?.username}</p>
                                    <p className="text-foreground/60 text-sm">{user?.role}</p>
                                </div>
                            </div>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <Button
                                variant="light"
                                className="w-full justify-start"
                                startContent={<FluentSettings16Filled />}
                                onPress={() => {
                                    router.push('/settings');
                                    setIsMenuOpen(false);
                                }}
                            >
                                Settings
                            </Button>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <Button
                                onPress={() => {
                                    onLogout();
                                    setIsMenuOpen(false);
                                }}
                                color="danger"
                                variant="flat"
                                className="w-full font-bold"
                            >
                                Sign out
                            </Button>
                        </NavbarMenuItem>
                    </>
                )}
            </NavbarMenu>
        </Nav>
    )
}

export default Navbar
