import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import OrganiserDashboard from './OrganiserDashboard';

export default async function OrganiserPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/organiser');
  }

  return <OrganiserDashboard />;
}
