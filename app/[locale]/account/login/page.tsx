"use client"

import { CustomButton } from "@/components/Button";
import { useAuth } from "@/context/Auth";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

export default function LogInPage() {
  const { isAdmin, isLoading } = useAuth()

  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")

  if(isLoading) return "Loading"
  if(!isAdmin) return <div>
    <div>You're not logged in</div>

    <CustomButton
      buttonText="Login with Discord"
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "discord",
          options: {
            redirectTo: `${window.location.origin}${redirect || "/account/login"}`,
          },
        })
      }
    />
  </div>

  return <div>
    <div>You're an admin</div>
    
    <CustomButton
      buttonText="Log Out"
      onClick={async () => {
        await supabase.auth.signOut()
        alert("You're logged out")
      }}
    />
  </div>
}