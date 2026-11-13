import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'ADMIN') redirect('/account');

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
  });

  const contacts = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminDashboard
      products={products as never}
      contacts={contacts as never}
      orders={orders as never}
      categories={categories as never}
    />
  );
}