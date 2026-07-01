import type { Donation } from './types'

const demoRows: Array<
  [donorName: string, amount: number, status: Donation['status'], paymentType: Donation['paymentType'], anonymous?: boolean]
> = [
  ['Aminata Conteh', 100, 'received', 'Cash'],
  ['Mohamed Koroma', 200, 'pledged', 'Pledge'],
  ['Youth Alumni Group', 500, 'received', 'Orange Money'],
  ['Anonymous', 40, 'received', 'Cash', true],
  ['Fatmata Bangura', 160, 'pledged', 'Pledge'],
]

export function createDemoDonations() {
  const now = Date.now()

  return demoRows.map(([donorName, amount, status, paymentType, anonymous = false], index) => {
    const timestamp = new Date(now + index * 1000).toISOString()
    const receivedAmount = status === 'received' ? amount : 0

    return {
      id: crypto.randomUUID(),
      reference: '',
      donorName,
      donorContact: '',
      amount,
      receivedAmount,
      status,
      paymentType,
      paymentReference: '',
      category: index % 2 === 0 ? 'Camp Support' : 'General',
      anonymous,
      note: 'Demo entry',
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies Donation
  })
}
