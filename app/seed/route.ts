import { createClient } from "@/app/lib/supabase/client";
import { invoices, customers, revenue } from "../lib/placeholder-data";

const supabase = createClient();

async function seedInvoices() {
  const insertedInvoices = await Promise.all(
    invoices.map((invoice) =>
      supabase.from("invoices").upsert({
        customer_id: invoice.customer_id,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
      })
    )
  );

  return insertedInvoices;
}

async function seedCustomers() {
  const insertedCustomers = await Promise.all(
    customers.map((customer) =>
      supabase.from("customers").upsert({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
      })
    )
  );

  return insertedCustomers;
}

async function seedRevenue() {
  const insertedRevenue = await Promise.all(
    revenue.map((rev) =>
      supabase.from("revenue").upsert({
        month: rev.month,
        revenue: rev.revenue,
      })
    )
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    return Response.json({ message: "Database seeded" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
