"use server"

import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000"

export async function getSession() {
    const  cookiesStore = await cookies();
    const token = cookiesStore.get("token") ?? null;

    if(!token){
        return null;
    }

    const res = await fetch(`${API_URL}/users/me`, {
        headers:{
            Authorization: `Bearer ${token}`
        },
        cache: "no-store"
    })

    if (!res.ok){
        return null;
    }

    const user = await res.json()
    return { user, token }

}