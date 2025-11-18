"use client";

import { Button } from "@/components/ui/button";

interface StepControlsProps {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onFinish?: () => void;
}

export default function StepControls({
  step,
  onBack,
  onNext,
  onFinish,
}: StepControlsProps) {
  const backLabels: Record<number, string> = {
    1: "Volver al paso 1",
    2: "Volver al paso 1",
    3: "Volver al paso 2",
    4: "Volver al paso 3",
  };

  const showNext = step < 4;
  const showFinish = step === 4;

  return (
    <div className="flex justify-between items-center mb-6 mt-4">
      <Button variant="outline" className="cursor-pointer" onClick={onBack}>
        ← {backLabels[step]}
      </Button>

      {showNext && (
        <Button
          className="bg-[#235391] text-white hover:bg-[#1e3a8a]"
          onClick={onNext}
        >
          Siguiente
        </Button>
      )}

      {showFinish && (
        <Button
          className="bg-[#5b21b6] text-white hover:bg-[#4c1d95]"
          onClick={onFinish}
        >
          Finalizar
        </Button>
      )}
    </div>
  );
}