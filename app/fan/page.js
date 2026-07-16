import FanDashboard from './FanDashboard';

export const revalidate = 60; // Cache the route data for 60 seconds

export default function FanPage() {
  return <FanDashboard />;
}
