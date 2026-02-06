"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function GoBackButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => window.history.back()}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </Button>
  );
}
