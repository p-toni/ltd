import SystemDashboardWrapper from '@/components/system-dashboard-wrapper'
import { getPieces } from '@/lib/pieces'

export default async function Page() {
  const pieces = await getPieces()
  return <SystemDashboardWrapper pieces={pieces} />
}
