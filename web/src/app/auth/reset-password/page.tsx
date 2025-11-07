"use client";
import React, { useState, useEffect } from "react";
import { resetPassword } from "../forgot-password/utils";
import AuthFlowContainer from "@/components/auth/AuthFlowContainer";
import Title from "@/components/ui/title";
import Text from "@/components/ui/text";
import Link from "next/link";
import Button from "@/refresh-components/buttons/Button";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { TextFormField } from "@/components/Field";
import { usePopup } from "@/components/admin/connectors/Popup";
import { Spinner } from "@/components/Spinner";
import { redirect, useSearchParams } from "next/navigation";
import {
  NEXT_PUBLIC_FORGOT_PASSWORD_ENABLED,
  TENANT_ID_COOKIE_NAME,
} from "@/lib/constants";
import Cookies from "js-cookie";

const ResetPasswordPage: React.FC = () => {
  const { popup, setPopup } = usePopup();
  const [isWorking, setIsWorking] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const tenantId = searchParams?.get(TENANT_ID_COOKIE_NAME);
  // Keep search param same name as cookie for simplicity

  useEffect(() => {
    if (tenantId) {
      Cookies.set(TENANT_ID_COOKIE_NAME, tenantId, {
        path: "/",
        expires: 1 / 24,
      }); // Expires in 1 hour
    }
  }, [tenantId]);

  if (!NEXT_PUBLIC_FORGOT_PASSWORD_ENABLED) {
    redirect("/auth/login");
  }

  return (
    <AuthFlowContainer>
      <div className="flex flex-col w-full justify-center">
        <div className="flex">
          <Title className="mb-2 mx-auto font-bold">Passwort zurücksetzen</Title>
        </div>
        {isWorking && <Spinner />}
        {popup}
        <Formik
          initialValues={{
            password: "",
            confirmPassword: "",
          }}
          validationSchema={Yup.object().shape({
            password: Yup.string().required("Passwort ist erforderlich"),
            confirmPassword: Yup.string()
              .oneOf([Yup.ref("password"), undefined], "Passwörter müssen übereinstimmen")
              .required("Bitte Passwort bestätigen"),
          })}
          onSubmit={async (values) => {
            if (!token) {
              setPopup({
                type: "error",
                message: "Ungültiges oder fehlendes Reset-Token.",
              });
              return;
            }
            setIsWorking(true);
            try {
              await resetPassword(token, values.password);
              setPopup({
                type: "success",
                message: "Passwort erfolgreich zurückgesetzt. Weiterleitung zur Anmeldung...",
              });
              setTimeout(() => {
                redirect("/auth/login");
              }, 1000);
            } catch (error) {
              if (error instanceof Error) {
                setPopup({
                  type: "error",
                  message:
                    error.message || "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.",
                });
              } else {
                setPopup({
                  type: "error",
                  message: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
                });
              }
            } finally {
              setIsWorking(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="w-full flex flex-col items-stretch mt-2">
              <TextFormField
                name="password"
                label="Neues Passwort"
                type="password"
                placeholder="Geben Sie ein neues Passwort an"
              />
              <TextFormField
                name="confirmPassword"
                label="Neues Passwort bestätigen"
                type="password"
                placeholder="Bestätigen Sie Ihr neues Passwort"
              />

              <div className="flex">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mx-auto w-full"
                >
                  Passwort zurücksetzen
                </Button>
              </div>
            </Form>
          )}
        </Formik>
        <div className="flex">
          <Text className="mt-4 mx-auto">
            <Link href="/auth/login" className="text-link font-medium">
              Zurück zum Login
            </Link>
          </Text>
        </div>
      </div>
    </AuthFlowContainer>
  );
};

export default ResetPasswordPage;
