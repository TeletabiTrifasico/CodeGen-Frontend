export type UserRole = 'CUSTOMER' | 'EMPLOYEE'
export type AccountType = 'CHECKING' | 'SAVINGS'
export type TransactionType = 'TRANSFER' | 'ATM_DEPOSIT' | 'ATM_WITHDRAWAL'

export interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  bsn: string
  dateOfBirth: string
  role: UserRole
  approved: boolean
}

export interface Account {
  id: number
  iban: string
  accountType: AccountType
  balance: number
  absoluteLimit: number
  dayLimit: number
  transactionLimit: number
  active: boolean
  createdAt: string
  ownerUsername: string
  ownerFullName: string
}

export interface Transaction {
  id: number
  reference: string
  sourceIban: string | null
  destinationIban: string | null
  amount: number
  description: string
  type: TransactionType
  timestamp: string
  initiatedByUsername: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface AtmResponse {
  reference: string
  newBalance: number
  message: string
}
