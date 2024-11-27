"use server";

import { z } from "zod";
import { createClient } from "@/app/lib/supabase/server";
import { expirePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const supabase = await createClient();

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
  const amountInCents = amount * 100;
  const supabase = await createClient();

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
  const supabase = await createClient();
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

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string(),
});

export type LoginState = {
  validationErrors?: {
    email?: string[];
    password?: string[];
  };
  error?: string | null;
};

export async function login(prevState: LoginState, formData: FormData) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      error: "Login failed. Please try again.",
    };
  }

  expirePath("/dashboard");
  redirect("/dashboard");
}

const passwordSchema = z
  .string()
  .min(6, "Password must contain at least 6 characters");

const passwordMatchSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "Passwords do not match.",
      });
    }
  });

const registerSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address." }),
  })
  .and(passwordMatchSchema);

export type RegisterState = {
  validationErrors?: {
    email?: string[];
    password?: string[];
    passwordConfirm?: string[];
  };
  error?: string | null;
};

export async function register(prevState: RegisterState, formData: FormData) {
  const validatedFields = registerSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error: "Email already in use",
    };
  }

  expirePath("/register/confirmation");
  redirect("/register/confirmation");
}

const forgotPassShema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type ForgotPasswordState = {
  validationErrors?: {
    email?: string[];
  };
  error?: string | null;
};

export async function forgotPassword(
  prevState: ForgotPasswordState,
  formData: FormData
) {
  const validatedFields = forgotPassShema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email } = validatedFields.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return {
      error: error.message,
    };
  }

  expirePath("/forgot-password/confirmation");
  redirect("/forgot-password/confirmation");
}

export type ResetPasswordState = {
  validationErrors?: {
    password?: string[];
    passwordConfirm?: string[];
  };
  error?: string | null;
};

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData
) {
  const validatedFields = passwordMatchSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { password } = validatedFields.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  console.log(data);
  if (error) {
    return {
      error: error.message,
    };
  }

  expirePath("/dashboard");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
