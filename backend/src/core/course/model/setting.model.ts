import mongoose from "mongoose";
import { ISetting } from "./interface/setting";

const { Schema } = mongoose

export const SettingSchema = new Schema<ISetting>({
    schedule_id: {
        type: Schema.Types.String,
        required: true
    }
})
