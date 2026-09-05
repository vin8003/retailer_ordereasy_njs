"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PriceUpdatePrintPromptProps {
  open: boolean;
  productName?: string;
  onPrint: () => void;
  onClose: () => void;
}

export function PriceUpdatePrintPrompt({ open, productName, onPrint, onClose }: PriceUpdatePrintPromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Price updated!</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to print new labels{productName ? ` for ${productName}` : " for this item"}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={onPrint}>Print labels</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
