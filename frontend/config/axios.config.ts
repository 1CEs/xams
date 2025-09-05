import { baseAPIPath } from "@/constants/base";
import axios from "axios";

export const clientAPI = axios.create({
    baseURL: baseAPIPath,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json',
})

// Public API client for unauthenticated requests
export const publicAPI = axios.create({
    baseURL: baseAPIPath,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json',
})