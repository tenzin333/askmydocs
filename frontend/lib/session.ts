"use server"

import { cookies } from "next/headers"

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value ?? null  //  .value
 
  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/api/users/me`, {  //  FastAPI direct
      headers: {
        Authorization: `Bearer ${token}`              //  string
      },
      cache: "no-store"
    })
    
    if (!res.ok) return null

    const user = await res.json()
  
    return { user, token }                            //  token is string

  } catch {
  
    return null
  }
}