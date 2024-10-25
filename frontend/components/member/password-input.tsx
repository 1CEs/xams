
import { Input } from '@nextui-org/react';
import React, { useState } from 'react'
import { PhEyeDuotone, PhEyeSlash } from '../icons/icons';

type Props = {
    name: string
    label?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg' 
}   

const PasswordInput = (props: Props) => {
    const [isVisible, setIsVisible] = useState(false);
    const toggleVisibility = () => setIsVisible(!isVisible);

    return (
        <Input
            size={props.size ? props.size : 'md'}
            name={props.name}
            isRequired
            label={props.label ? props.label : "Password"}
            placeholder={props.placeholder ? props.placeholder : "Enter your password"}
            endContent={
                <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                    {isVisible ? (
                        <PhEyeSlash className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                        <PhEyeDuotone className="text-2xl text-default-400 pointer-events-none" />
                    )}
                </button>
            }
            type={isVisible ? "text" : "password"}
        />
    );
}

export default PasswordInput