"use client";

import { TextFormField } from "@/components/Field";
import { usePopup } from "@/components/admin/connectors/Popup";
import { basicLogin, basicSignup } from "@/lib/user";
import Button from "@/refresh-components/buttons/Button";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { requestEmailVerification } from "../lib";
import { useState } from "react";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";
import { useUser } from "@/components/user/UserProvider";
import { validateInternalRedirect } from "@/lib/auth/redirectValidation";
import { FiEye, FiEyeOff } from "react-icons/fi"; 

interface EmailPasswordFormProps {
  isSignup?: boolean;
  shouldVerify?: boolean;
  referralSource?: string;
  nextUrl?: string | null;
  defaultEmail?: string | null;
  isJoin?: boolean;
}

export default function EmailPasswordForm({
  isSignup = false,
  shouldVerify,
  referralSource,
  nextUrl,
  defaultEmail,
  isJoin = false,
}: EmailPasswordFormProps) {
  const { user } = useUser();
  const { popup, setPopup } = usePopup();
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);  
  const togglePasswordVisibility = () => { 
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      {isWorking && <Spinner />}
      {popup}

      <Formik
        initialValues={{
          email: defaultEmail ? defaultEmail.toLowerCase() : "",
          password: "",
        }}
        validateOnChange={false}
        validateOnBlur={true}
        validationSchema={Yup.object().shape({
          email: Yup.string()
            .email()
            .required("E-Mail ist ein Pflichtfeld")
            .transform((value) => value.toLowerCase()),
          password: Yup.string().required("Passwort ist ein Pflichtfeld"),
        })}
        onSubmit={async (values: { email: string; password: string }) => {
          // Ensure email is lowercase
          const email: string = values.email.toLowerCase();

          if (isSignup) {
            // login is fast, no need to show a spinner
            setIsWorking(true);
            const response = await basicSignup(
              email,
              values.password,
              referralSource
            );

            if (!response.ok) {
              setIsWorking(false);

              const errorDetail: any = (await response.json()).detail;
              let errorMsg: string = "Unkannter Fehler";
              if (typeof errorDetail === "object" && errorDetail.reason) {
                errorMsg = errorDetail.reason;
              } else if (errorDetail === "REGISTER_USER_ALREADY_EXISTS") {
                errorMsg =
                  "Es existiert bereits ein Konto mit der angegebenen E-Mail-Adresse.";
              }
              if (response.status === 429) {
                errorMsg = "Zu viele Versuche. Bitte versuchen Sie es später erneut.";
              }
              setPopup({
                type: "error",
                message: `Anmeldung fehlgeschlagen - ${errorMsg}`,
              });
              setIsWorking(false);
              return;
            } else {
              setPopup({
                type: "success",
                message: "Konto erfolgreich erstellt. Bitte melden Sie sich an.",
              });
            }
          }

          const loginResponse = await basicLogin(email, values.password);
          if (loginResponse.ok) {
            if (isSignup && shouldVerify) {
              await requestEmailVerification(email);
              // Use window.location.href to force a full page reload,
              // ensuring app re-initializes with the new state (including
              // server-side provider values)
              window.location.href = "/auth/waiting-on-verification";
            } else {
              // The searchparam is purely for multi tenant developement purposes.
              // It replicates the behavior of the case where a user
              // has signed up with email / password as the only user to an instance
              // and has just completed verification
              const validatedNextUrl = validateInternalRedirect(nextUrl);
              window.location.href = validatedNextUrl
                ? validatedNextUrl
                : `/chat${isSignup && !isJoin ? "?new_team=true" : ""}`;
            }
          } else {
            setIsWorking(false);
            const errorDetail: any = (await loginResponse.json()).detail;
            let errorMsg: string = "Unbekannter Fehler";
            if (errorDetail === "LOGIN_BAD_CREDENTIALS") {
              errorMsg = "Ungültige E-Mail-Adresse oder Passwort.";
            } else if (errorDetail === "NO_WEB_LOGIN_AND_HAS_NO_PASSWORD") {
              errorMsg = "Erstellen Sie ein Konto, um ein Passwort festzulegen.";
            } else if (typeof errorDetail === "string") {
              errorMsg = errorDetail;
            }
            if (loginResponse.status === 429) {
              errorMsg = "Zu viele Anfragen. Bitte versuchen Sie es später erneut.";
            }
            setPopup({
              type: "error",
              message: `Anmeldung fehlgeschlagen - ${errorMsg}`,
            });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <TextFormField
              name="email"
              label="Email"
              type="email"
              placeholder="email@lfst.bayern.de"
              data-testid="email"
            />

            <TextFormField
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}  // ← CHANGE THIS LINE (replace "password" with the conditional)
            placeholder="**************"
            data-testid="password"
            endAdornment={  // ← ADD THIS ENTIRE BLOCK (add before the closing />)
            <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-text-03 hover:text-text-04 focus:outline-none"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
            }
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isJoin ? "Beitreten" : isSignup ? "Anmelden" : "Einloggen"}
            </Button>
            {user?.is_anonymous_user && (
              <Link
                href="/chat"
                className="text-xs text-action-link-05 cursor-pointer text-center w-full font-medium mx-auto"
              >
                <span className="hover:border-b hover:border-dotted hover:border-action-link-05">
                  oder als Gast fortfahren
                </span>
              </Link>
            )}
          </Form>
        )}
      </Formik>
    </>
  );
}
