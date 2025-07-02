import { Document } from "mongoose"
import { UserRepositoryType, UserRole } from "../../../types/user"
import { IInstructor } from "../model/interface/iintructor"
import { IStudent } from "../model/interface/istudent"
import { IUser } from "../model/interface/iuser"
import { UserRepoFactory } from "../repository/user.factory"
import { UserRepository } from "../repository/user.repository"
import { IUserService } from "./interface/iuser.service"
import { generateToken, verifyToken } from "../../../utils/token"
import { sendEmail } from "../../../utils/email"

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export class UserService<T extends IUser | IStudent | IInstructor> implements IUserService<T> {
    protected _repository: UserRepositoryType

    constructor(role: UserRole) {
        const factory = new UserRepoFactory()
        this._repository = factory.createRepository(role)
    }

    async register(payload: Partial<T>) {
        if (!payload.email || !payload.username || !payload.password) {
            throw new Error("Email, username, and password are required fields.")
        }

        // const [userFromEmail, userFromUsername] = await Promise.all([
        //     this.getUserByEmail(payload.email),
        //     this.getUserByUsername(payload.username)
        // ])

        // console.log(userFromEmail, userFromUsername)
        // if (userFromEmail || userFromUsername) {
        //     return {
        //         message: `User with ${userFromEmail ? 'email' : 'username'} already exists.`
        //     }
        // }
        const hashedPassword = await Bun.password.hash(payload.password, {
            algorithm: 'bcrypt',
            cost: 4,
        })

        const result = await this._repository.save({
            ...payload,
            password: hashedPassword,
        })

        return result as (T & Document | null)
    }

    async getUsers() {
        const result = await this._repository.find({}, { password: 0 })
        return result as T[] | null
    }

    async getUserById(_id: string) {
        const result = await this._repository.findById(_id, { password: 0 })
        return result as T | null
    }

    async getUserByEmail(email: string) {
        const result = await (this._repository as UserRepository).findByEmail(email)
        return result as T | null
    }

    async getUserByUsername(username: string) {
        const result = await (this._repository as UserRepository).findByUsername(username)
        console.log(result)
        return result as T | null
    }

    async updateUser(_id: string, payload: Partial<T>) {
        const result = await this._repository.update(_id, payload, { password: 0 })
        return result as T | null
    }

    async deleteUser(_id: string) {
        const result = await this._repository.delete(_id)
        return result as T | null
    }

    async forgotPassword(email: string, jwt: JWTInstance) {
        const user = await this.getUserByEmail(email)
        if (!user) {
            return {
                message: "User not found"
            }
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = await generateToken(jwt, { 
            id: String(user._id),
            email: user.email 
        }, '1h')

        // Send reset password email
        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <tr>
                        <td style="background-color: #101010; padding: 20px; border-radius: 8px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <img src="https://i.imgur.com/sc8ZtF1.png" 
                                             alt="XAMS Logo" 
                                             style="max-width: 200px; height: auto; margin-bottom: 20px;">
                                        <h1 style="color: #82f4b1; font-size: 24px; margin: 0; padding: 0;">Password Reset Request</h1>
                                        <div style="width: 50px; height: 3px; background-color: #82f4b1; margin: 10px auto;"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #eee; text-align: center; padding: 0 0 20px 0; line-height: 1.5;">
                                        You have requested to reset your password. Click the button below to proceed:
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.FRONTEND_URL}/member/reset-password?token=${resetToken}" 
                                           style="background-color: #82f4b1; color: #101010; padding: 12px 24px; text-decoration: none; 
                                                  border-radius: 4px; font-weight: bold; display: inline-block;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #999; font-size: 14px; padding: 10px 0;">
                                        This link will expire in 1 hour.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #999; font-size: 14px; padding: 10px 0;">
                                        If you did not request this, please ignore this email.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-top: 1px solid #333; margin-top: 20px; padding-top: 20px; text-align: center;">
                                        <p style="color: #999; font-size: 12px; margin: 0;">
                                            This is an automated message, please do not reply to this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            `
        })

        return { message: "Password reset email sent successfully" }
    }

    async resetPassword(token: string, newPassword: string, jwt: JWTInstance) {
        // Verify the reset token
        const decoded = await verifyToken(jwt, token)
        
        // Find user by ID from token
        const user = await this.getUserById(decoded.id)
        if (!user) {
            throw new Error("User not found")
        }

        // Hash the new password
        const hashedPassword = await Bun.password.hash(newPassword, {
            algorithm: 'bcrypt',
            cost: 4,
        })

        // Update user's password
        const updated = await this.updateUser(String(user._id), { 
            password: hashedPassword 
        } as Partial<T>)

        if (!updated) {
            throw new Error("Failed to update password")
        }

        return { message: "Password has been reset successfully" }
    }
}
