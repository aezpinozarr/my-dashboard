import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function StepControls({
  step,
  setStep,
  handleGuardarRector,
  handleGuardarRubros,
  handleFinalizarProceso,
}: any) {
  return (
    <div className="flex justify-end gap-2 mb-4">
      {/* Paso 1 → botón avanzar */}
      {step === 1 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleGuardarRector}
                style={{ backgroundColor: "#235391", color: "white" }}
              >
                Avanzar al paso 2 →
              </Button>
            </TooltipTrigger>
            <TooltipContent>Guardar y avanzar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Paso 2 → regresar */}
      {step === 2 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Volver al paso 1
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regresar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Paso 2 → finalizar */}
      {step === 2 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleFinalizarProceso}
                style={{ backgroundColor: "#0A7C1D", color: "white" }}
              >
                Finalizar proceso
              </Button>
            </TooltipTrigger>
            <TooltipContent>Guardar y finalizar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}