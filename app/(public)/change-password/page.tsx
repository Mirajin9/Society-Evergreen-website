import { Suspense } from "react";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = {
  title: "Change password | Evergreen Apartment"
};

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="loading-pad">Loading...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
