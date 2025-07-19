export interface ISetting {
    _id?: string
    schedule_id: string  // Reference to the examination schedule - this is now the primary key
}
