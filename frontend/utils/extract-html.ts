export const extractHtml = (html: string) => {
    const regex = /<[^>]*>/g
    return html.replace(regex, "")
}