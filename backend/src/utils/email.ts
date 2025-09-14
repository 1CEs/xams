import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string
    subject: string
    html: string
    replyTo?: string
}

export const sendEmail = async (options: EmailOptions): Promise<{ isSent: boolean }> => {
    console.log("Sending email.")
    console.log(process.env.NAMECHEAP_HOST, process.env.NAMECHEAP_PORT, process.env.NAMECHEAP_USER, process.env.NAMECHEAP_PASS)
    if (!process.env.NAMECHEAP_HOST || !process.env.NAMECHEAP_PORT || !process.env.NAMECHEAP_USER || !process.env.NAMECHEAP_PASS) {
        throw new Error('Email configuration is not complete')
    }

    const transporter = nodemailer.createTransport({
        host: process.env.NAMECHEAP_HOST,
        port: parseInt(process.env.NAMECHEAP_PORT),
        secure: true,
        auth: {
          user: process.env.NAMECHEAP_USER,
          pass: process.env.NAMECHEAP_PASS
        },
        logger: true
    });

    const mailOptions = {
        from: `"XAMS Support" <${process.env.NAMECHEAP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || process.env.NAMECHEAP_USER,
    }

    try {
        new Promise<void>((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
            transporter.close()
            console.log("Email sent successfully.")
            resolve()
        })
        return { isSent: true }
    } catch (error) {
        transporter.close()
        console.error('Error sending email:', error)
        throw new Error('Failed to send email')
    }
} 