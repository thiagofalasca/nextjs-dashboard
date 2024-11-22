import { fetchFilteredCustomers } from "@/app/lib/data";
import Table from "@/app/ui/customers/table";
import { lusitana } from "@/app/ui/fonts";
import Search from "@/app/ui/search";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const customers = await fetchFilteredCustomers(query);
  return (
    <div className="w-full">
      <Table customers={customers} />
    </div>
  );
}
