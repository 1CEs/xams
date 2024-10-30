import { MaterialSymbolsListAlt, PajamasFalsePositive, MaterialSymbolsMatchWordRounded, MaterialSymbolsMatchCaseRounded, CarbonTextLongParagraph } from "@/components/icons/icons";

export const questionTypes = [
    {
        name: 'mc',
        content: 'Multiple Choice',
        icon: <MaterialSymbolsListAlt fontSize={32} />,
    },
    {
        name: 'tf',
        content: 'True False',
        icon: <PajamasFalsePositive fontSize={32} />,
    },
    {
        name: 'ma',
        content: 'Matching',
        icon: <MaterialSymbolsMatchWordRounded fontSize={32} />,
    },
    {
        name: 'ft',
        content: 'Free Text',
        icon: <MaterialSymbolsMatchCaseRounded fontSize={32} />,
    },
    {
        name: 'es',
        content: 'Essay',
        icon: <CarbonTextLongParagraph fontSize={32} />,
    },
]