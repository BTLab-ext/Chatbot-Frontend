"use client";

import AuthFlowContainer from "@/components/auth/AuthFlowContainer";
import { REGISTRATION_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FiLogIn } from "react-icons/fi";

const Page = () => {
  return (
    <AuthFlowContainer>
      <div className="flex flex-col space-y-6">
        <h2 className="text-2xl font-bold text-text-900 text-center">
          Konto wurde nicht gefunden.
        </h2>
        <p className="text-text-700 max-w-md text-center">
          Wir konnte dein Konnte nicht finden. Um auf chat.BAI zugreifen zu können, musst du entweder:
        </p>
        <ul className="list-disc text-left text-text-600 w-full pl-6 mx-auto">
          <li>Zu einem existierenden Team eingeladen werden</li>
          <li>Ein Team erstellen</li>
        </ul>
        <div className="flex justify-center">
          <Link
            href={`${REGISTRATION_URL}/register`}
            className="w-full max-w-xs"
          >
            <Button size="lg" icon={FiLogIn} className="w-full">
              Erstelle neue Organisation
            </Button>
          </Link>
        </div>
        <p className="text-sm text-text-500 text-center">
          Haben Sie eine Konto mit einer anderen E-Mail Adresse?{" "}
          <Link href="/auth/login" className="text-indigo-600 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </AuthFlowContainer>
  );
};

export default Page;
