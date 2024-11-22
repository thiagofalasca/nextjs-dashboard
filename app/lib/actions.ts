"use server";

import { z } from "zod";
import { supabase } from "./supabase/supabaseClient";
import { expirePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    message: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    message: "Please select an invoice status.",
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    const { error } = await supabase
      .from("invoices")
      .insert([
        { customer_id: customerId, amount: amountInCents, date, status },
      ]);

    if (error) throw error;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice.");
  }

  expirePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = validatedFields.data.amount * 100;

  try {
    const { error } = await supabase
      .from("invoices")
      .update({ customer_id: customerId, amount: amountInCents, status })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice.");
  }

  expirePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    const { error } = await supabase.from("invoices").delete().match({ id });
    expirePath("/dashboard/invoices");
    if (error) throw error;
    return { message: "Invoice deleted successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete invoice.");
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
