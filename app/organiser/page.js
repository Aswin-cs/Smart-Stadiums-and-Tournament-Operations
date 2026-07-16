import OrganiserDashboard from './OrganiserDashboard';

export const revalidate = 60; // Cache the route data for 60 seconds

export default function OrganiserPage() {
  return <OrganiserDashboard />;
}
