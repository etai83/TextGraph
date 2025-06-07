"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createGraphSpace } from "@/app/actions/manageTextActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { toast } from "sonner"; // Changed import

export function CreateGraphSpaceForm() {
  const initialState = { error: null, success: false, graphSpace: null };
  const [state, dispatch] = useFormState(createGraphSpace, initialState);
  const { pending } = useFormStatus();
  // Removed const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error); // Changed usage
    }
    if (state?.success) { // Simplified success condition for toast
      toast.success("Graph Space created!"); // Changed usage
      // Consider resetting the form or redirecting
    }
  }, [state]); // Removed toast from dependencies

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" name="description" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Graph Space"}
      </Button>
    </form>
  );
}
