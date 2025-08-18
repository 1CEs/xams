import { Radio, RadioGroup } from '@nextui-org/react'
import { useFormikContext } from 'formik'

const TrueOrFalseForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    return (
        <div className="px-2 sm:px-6 lg:px-10">
            <RadioGroup
                label="Select the correct answer"
                orientation="horizontal"
                value={values.isTrue?.toString()}
                onValueChange={(value) => setFieldValue('isTrue', value === 'true')}
                classNames={{
                    wrapper: "flex-col sm:flex-row gap-4 sm:gap-6"
                }}
            >
                <Radio value="true">True</Radio>
                <Radio value="false">False</Radio>
            </RadioGroup>
        </div>
    )
}

export default TrueOrFalseForm