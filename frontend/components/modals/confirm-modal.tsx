import { Button, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'
import React from 'react'
import { FluentColorWarning16 } from '../icons/icons'

type Props = {
    header: string
    subHeader: string
    content: string
    onAction: () => void
}

const ConfirmModal = (props: Props) => {
    return (
        <ModalContent>
            {(onClose) => (
                <div>
                    <ModalHeader>
                        <div className='flex flex-col gap-y-2'>
                            <h1>{props.header}</h1>
                            <span className='text-sm'>{props.subHeader}</span>
                        </div>

                    </ModalHeader>
                    <ModalBody className='py-0'>
                        <div className='p-3 bg-warning-200/50 border-l-5 border-warning'>
                            <div className='flex items-center gap-x-3'>
                                <FluentColorWarning16 fontSize={24} />
                                <span>Warning</span>
                            </div>
                            <span className='text-tiny'>
                                {props.content}
                            </span>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant='light' onPress={onClose}>
                            Close
                        </Button>
                        <Button color='danger' onPress={() => {
                            props.onAction()
                            onClose()
                        }}>
                            Delete
                        </Button>
                    </ModalFooter>
                </div>

            )}
        </ModalContent>
    )
}

export default ConfirmModal