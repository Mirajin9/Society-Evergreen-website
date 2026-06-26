import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Member Login — Evergreen Apartment",
  description: "Login with your registered mobile number to access the Evergreen Apartment member portal."
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-pad">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
