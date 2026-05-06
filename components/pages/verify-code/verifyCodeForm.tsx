"use client";

import { Input } from "@/components/local-ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/local-ui/errorMessage";
import { SuccessMessage } from "@/components/local-ui/successMessage";
import { AuthenticateWith } from "@/components/local-ui/authenticateWith";
import resendCodeAction from "@/app/lib/actions/resendCodeAction";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import routes from "@/data/routes.json";

export function VerifyCodeForm() {
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [res, setRes] = useState<any>({});

  useEffect(() => {
    if (searchParams.has("sent")) {
      toast({ title: "Sent", description: "Verification code has been sent to you email", variant: "default" });
      router.replace(routes["verify-password-reset-code"].path);
    }
    if (res?.success == true) {
      setTimeout(() => router.replace(routes["set-new-password"].path), 1000);
    }
  }, [searchParams, res?.success, router, toast]);

  async function resendCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.disabled = true;
    try {
      const response = await resendCodeAction();
      setRes(response);
      if (response?.success == true) {
        router.replace(`${routes["verify-password-reset-code"].path}?sent=true`);
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong on resending", variant: "destructive" });
    }
    e.currentTarget.disabled = false;
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitBtnRef.current) submitBtnRef.current.disabled = true;
    const formData = new FormData(e.currentTarget);
    const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/verify?p_reset_v_token=" + (formData.get("p_reset_v_token") || "null"), { method: "GET" });
    const data = await res.json();
    setRes(data);
    if (submitBtnRef.current) submitBtnRef.current.disabled = false;
  }

  return (
    <div className="bg-white p-7 rounded-lg shadow-lg">
      <div className="mb-5">
        {res?.success == true && <SuccessMessage message={res?.message + ", You are being redirected"} />}
        {res?.success === false && res?.message && <ErrorMessage message={res?.message} />}
      </div>
      <form id="password-reset-form" onSubmit={submitForm}>
        <Input label="Enter Code" type="text" name="p_reset_v_token" placeholder="Enter 6 digit code" error={res?.error?.p_reset_v_token} />
        <p className="text-sm">
          Didn&apos;t receive a code?{" "}
          <Button type="button" variant="link" className="p-0 text-tertiary" onClick={resendCode}>Resend</Button>
        </p>
        <Button ref={submitBtnRef} type="submit" className="max-sm:w-full px-8">Verify</Button>
      </form>
      <AuthenticateWith message="Or login with" />
    </div>
  );
}