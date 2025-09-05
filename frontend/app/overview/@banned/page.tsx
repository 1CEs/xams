"use client"
import { useUserStore } from "@/stores/user.store"
import { Button } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "react-toastify"

export default function BannedPage() {
    const { user, setUser } = useUserStore()
    const router = useRouter()

    useEffect(() => {
        // If user is not suspended, redirect to appropriate page
        if (user && !user.status?.is_banned) {
            router.push('/overview')
        }
    }, [user, router])

    const handleSignOut = () => {
        setUser(null)
        // Clear any stored data
        localStorage.clear()
        sessionStorage.clear()
        toast.success("You have been signed out successfully.")
        router.push('/member/sign-in')
    }

    const formatSuspendUntil = (suspendUntil?: string) => {
        if (!suspendUntil) return "Indefinitely"
        
        try {
            const date = new Date(suspendUntil)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return "Invalid date"
        }
    }

    // Add defensive checks to prevent object rendering issues
    if (!user || !user.status || typeof user.status !== 'object' || user.status.is_banned !== true) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
                    {/* Suspend Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg 
                            className="w-10 h-10 text-red-600" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" 
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Account Suspended
                    </h1>

                    {/* User Info */}
                    <div className="mb-6">
                        <p className="text-gray-600 mb-2">
                            Hello, <span className="font-semibold">{user.info?.first_name} {user.info?.last_name}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            @{user.username}
                        </p>
                    </div>

                    {/* Suspension Details */}
                    <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-red-800 mb-3">Suspension Details:</h3>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium text-red-600">Suspended</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Until:</span>
                                <span className="font-medium text-red-600">
                                    {formatSuspendUntil(user.status.ban_until)}
                                </span>
                            </div>
                            
                            {user.status.ban_reason && (
                                <div className="mt-3 pt-3 border-t border-red-200">
                                    <span className="text-gray-600 block mb-1">Reason:</span>
                                    <p className="text-red-700 font-medium">
                                        {user.status.ban_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-gray-800 mb-2">What this means:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• You cannot access XAMS features</li>
                            <li>• You cannot take or create exams</li>
                            <li>• You cannot access course materials</li>
                            {user.status.ban_until && (
                                <li>• Access will be restored after the suspension period</li>
                            )}
                        </ul>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-700">
                            If you believe this is a mistake or would like to appeal this decision, 
                            please contact the system administrator or your institution's support team.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            color="danger"
                            variant="solid"
                            className="w-full"
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </Button>
                        
                        <p className="text-xs text-gray-500">
                            You will be automatically signed out for security purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
