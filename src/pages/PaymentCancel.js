import React, { useEffect } from "react";
import { useRouter } from "next/router"; // ou react-router-dom

const PaymentCancel = () => {
  const router = useRouter();
  const { ref } = router.query;

  useEffect(() => {
    // Rediriger vers le tableau de bord après 5 secondes
    const timer = setTimeout(() => {
      router.push("/patient-dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container py-5 text-center">
      <div className="alert alert-warning">
        <h2>Paiement annulé</h2>
        <p>Votre paiement a été annulé. Vous pouvez réessayer depuis votre tableau de bord.</p>
        <p>Référence: {ref}</p>
        <p>Vous allez être redirigé vers votre tableau de bord...</p>
      </div>
    </div>
  );
};

export default PaymentCancel;
