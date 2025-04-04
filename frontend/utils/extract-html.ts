export const extractHtml = (html: string | { content: string; isCorrect: boolean } | undefined) => {
    if (!html) return ''
    
    const regex = /<[^>]*>/g
    if (typeof html === 'string') {
        return html.replace(regex, "")
    }
    
    if (!html.content) return ''
    return html.content.replace(regex, "")
}