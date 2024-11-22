import { supabase } from "./supabase/supabaseClient";
import {
  CustomerField,
  CustomersTableType,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from "./definitions";
import { formatCurrency } from "./utils";

export async function fetchRevenueData() {
  try {
    const { data, error } = await supabase
      .from("revenue")
      .select("*")
      .returns<Revenue[]>();

    if (error) throw error;

    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    data.sort(
      (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    );

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices() {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, amount, customers(id, name, image_url, email)")
      .order("date", { ascending: false })
      .limit(5)
      .returns<LatestInvoiceRaw[]>();

    if (error) throw error;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    const [invoicesCount, paidInvoices, pendingInvoices, customersCount] =
      await Promise.all([
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase
          .from("invoices")
          .select("amount", { count: "exact" })
          .eq("status", "paid"),
        supabase
          .from("invoices")
          .select("amount", { count: "exact" })
          .eq("status", "pending"),
        supabase.from("customers").select("*", { count: "exact", head: true }),
      ]);

    if (invoicesCount.error) throw invoicesCount.error;
    if (paidInvoices.error) throw paidInvoices.error;
    if (pendingInvoices.error) throw pendingInvoices.error;
    if (customersCount.error) throw customersCount.error;

    const totalPaidAmount = paidInvoices.data.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    );
    const totalPendingAmount = pendingInvoices.data.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    );

    return {
      numberOfCustomers: customersCount.count || 0,
      numberOfInvoices: invoicesCount.count || 0,
      totalPaidInvoices: formatCurrency(totalPaidAmount),
      totalPendingInvoices: formatCurrency(totalPendingAmount),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const { data, error } = await supabase.rpc("search_invoices", {
      query,
      items_per_page: ITEMS_PER_PAGE,
      page_offset: offset,
    });

    if (error) throw error;

    interface invoiceType {
      id: string;
      amount: number;
      date: string;
      status: string;
      name: string;
      email: string;
      image_url: string;
    }

    const formattedData = data.map((invoice: invoiceType) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.date,
      status: invoice.status,
      customers: {
        name: invoice.name,
        email: invoice.email,
        image_url: invoice.image_url,
      },
    }));

    return formattedData;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const { data, error } = await supabase.rpc("count_invoices", { query });
    if (error) throw error;
    return Math.ceil(data / ITEMS_PER_PAGE);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices pages.");
  }
}

export async function fetchCustomers() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
      .order("name", { ascending: true })
      .returns<CustomerField[]>();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customers.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, amount, status, date, customer_id")
      .eq("id", id)
      .single();
    if (error) throw error;
    const invoice = {
      ...data,
      amount: data.amount / 100,
    };
    return invoice;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchFilteredCustomers(
  query: string
): Promise<CustomersTableType[]> {
  try {
    const { data, error } = await supabase.rpc("search_customers", { query });
    if (error) throw error;
    const customers = data.map((customer: CustomersTableType) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
    return customers;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customers.");
  }
}
