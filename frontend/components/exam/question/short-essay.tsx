import { useFormikContext } from 'formik'
import TextEditor from '../../text-editor'

const ShortEssayForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    return (
        <div className="px-10 flex flex-col gap-y-4">
            <TextEditor
                name="expectedAnswer"
                type="unnested"
                className="min-h-[150px]"
            />
        </div>
    )
}

export default ShortEssayForm