import { Radio, RadioGroup } from '@nextui-org/react'
import { useFormikContext } from 'formik'

const TrueOrFalseForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    return (
        <div className="px-10">
            <RadioGroup
                label="Select the correct answer"
                orientation="horizontal"
                value={values.isTrue?.toString()}
                onValueChange={(value) => setFieldValue('isTrue', value === 'true')}
            >
                <Radio value="true">True</Radio>
                <Radio value="false">False</Radio>
            </RadioGroup>
        </div>
    )
}

export default TrueOrFalseForm