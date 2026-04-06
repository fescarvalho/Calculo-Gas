import React from 'react'
import { getBuildings } from './actions'
import Dashboard from './components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const buildings = await getBuildings()

  // Set default initial month as current Month in YYYY-MM format
  const now = new Date()
  const initialMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  return (
    <main>
      <Dashboard buildings={buildings} initialMonth={initialMonth} />
    </main>
  )
}
