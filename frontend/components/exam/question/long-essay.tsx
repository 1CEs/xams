import { Input } from '@nextui-org/react'
import { useFormikContext } from 'formik'
import TextEditor from '../../text-editor'

const LongEssayForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    return (
        <div className="px-10 flex flex-col gap-y-4">
            <Input
                type="number"
                label="Maximum Word Count"
                placeholder="Enter maximum word count"
                value={values.maxWords?.toString()}
                onChange={(e) => setFieldValue('maxWords', parseInt(e.target.value) || 0)}
            />
            <TextEditor
                name="expectedAnswer"
                type="unnested"
                className="min-h-[300px]"
            />
        </div>
    )
}

export default LongEssayForm