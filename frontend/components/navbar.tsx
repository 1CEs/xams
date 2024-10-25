"use client"

import { Navbar as Nav, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import React from 'react'

const Navbar = () => {
    const router = useRouter()
    return (
        <Nav position='sticky' className='border-b border-secondary'>
            <NavbarBrand>
                <p className="font-bold hero-foreground">XAMS</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Features
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link href="#" aria-current="page">
                        Customers
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem>
                    <Button onPress={() => router.push('/member/sign-in')} className='text-primary' as={Link} color="primary" href="#" variant="flat">
                        Sign In
                    </Button>
                </NavbarItem>
            </NavbarContent>
        </Nav>
    )
}

export default Navbar