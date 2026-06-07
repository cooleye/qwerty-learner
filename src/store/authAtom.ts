import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface UserInfo {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  membership: string
  membershipExpireAt?: string | null
}

export const tokenAtom = atomWithStorage<string | null>('ql_token', null)
export const userAtom = atom<UserInfo | null>(null)

export const isLoggedInAtom = atom((get) => !!get(tokenAtom))

export const isVipAtom = atom((get) => {
  const user = get(userAtom)
  if (!user) return false
  if (user.membership !== 'vip') return false
  if (user.membershipExpireAt && new Date(user.membershipExpireAt) < new Date()) return false
  return true
})
