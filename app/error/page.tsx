"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasError) {
      router.replace("/");
    } else {
      setLoading(false);
    }
  }, [hasError, router]);

  if (loading) {
    return null; // ou um spinner de carregamento, se preferir
  }

  return (
    <div>
      <p>Sorry, something went wrong</p>
      <button onClick={() => router.push("/")}>Ir para a Home</button>
    </div>
  );
}
