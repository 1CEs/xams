import { ReactNode } from "react"
import { HeadLine } from "./exam/new-question-form"
import { Divider } from "@nextui-org/react"

export const StepProvider = (
    { children, content, number, isOptional }: 
    { children: ReactNode, content: string, number: number, isOptional?:boolean}
    ) => {
    return (
        <div className="flex flex-col gap-y-3">
            <HeadLine number={number} content={content} isOptional={isOptional}/>
            { children }
            {number !== 3 && <Divider className="mt-3" />}
        </div>
    )
}