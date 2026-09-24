import { Suspense } from "react";
import VerifyWhatsAppForm from "./VerifyWhatsAppForm";

export default function VerifyWhatsAppPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-gray-600">
            Loading verification...
          </div>
        </main>
      }
    >
      <VerifyWhatsAppForm />
    </Suspense>
  );
}
