"use client";

import Link from "next/link";
import React, { useActionState } from "react";
import { forgotPassword, ForgotPasswordState } from "../lib/actions";
import {
  ArrowRightIcon,
  AtSymbolIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button";

const ForgotPassword = () => {
  const initialState: ForgotPasswordState = {
    validationErrors: {},
    error: null,
  };
  const [state, formAction, isPending] = useActionState(
    forgotPassword,
    initialState
  );

  return (
    <main className="flex justify-center items-center min-h-screen">
      <div className="w-[380px]">
        <div>
          <p>Password Reset</p>
          <p>Enter your email address to reset your password</p>
        </div>
        <form action={formAction} className="space-y-3">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                name="email"
                placeholder="Enter your email address"
                required
                aria-describedby="email-error"
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="email-error" aria-live="polite" aria-atomic="true">
              {state.validationErrors?.email &&
                state.validationErrors?.email.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
          <Button className="mt-4 w-full" aria-disabled={isPending}>
            Reset Password{" "}
            <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <div className="flex h-8 items-end space-x-1">
            {state.error && (
              <>
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{state.error}</p>
              </>
            )}
          </div>
        </form>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
        <div className="text-muted-foreground text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
