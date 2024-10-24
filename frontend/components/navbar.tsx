import { Navbar as Nav, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from '@nextui-org/react'
import React from 'react'

const Navbar = () => {
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
                    <Button className='text-primary' as={Link} color="primary" href="#" variant="flat">
                        Sign Up
                    </Button>
                </NavbarItem>
            </NavbarContent>
        </Nav>
    )
}

export default Navbar