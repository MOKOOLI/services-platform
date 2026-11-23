import { notFound } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import { getProductType } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { slug: string } }) {
  const type = await getProductType(params.slug);
  if (!type) notFound();
  return (
    <>
      <h1>{type.name}</h1>
      <p className="muted">{type.description}</p>
      <OrderForm type={type} />
    </>
  );
}
