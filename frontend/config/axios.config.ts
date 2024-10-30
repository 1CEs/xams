import { baseAPIPath } from "@/constants/base";
import axios from "axios";

export const clientAPI = axios.create({
    baseURL: baseAPIPath,
    withCredentials: true,
    headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
    responseType: 'json',
})