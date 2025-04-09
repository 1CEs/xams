export interface IStudentService {
    // Implement student service logic.
    isUserAlreadyInGroup: (user_id: string, group_id: string) => Promise<boolean>
}