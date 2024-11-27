"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import Image from "next/image";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "./button";

export default function GoogleSignin() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth-code-error") {
      setError("Error signing in with Google.");
    }
  }, [searchParams]);

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
      setIsGoogleLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={signInWithGoogle}
        aria-disabled={isGoogleLoading}
      >
        <Image
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          width={20}
          height={20}
          className="mr-2"
        />
        Sign in with Google
      </Button>
      <div className="flex h-8 items-end space-x-1">
        {error && (
          <>
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
