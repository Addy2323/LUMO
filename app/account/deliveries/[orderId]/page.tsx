import { redirect } from 'next/navigation'

export default async function AccountDeliveryPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  redirect(`/orders/${orderId}/delivery-selection`)
}
