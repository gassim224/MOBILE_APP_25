import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '@/constants/AppConstants'
import type { UserProfile } from '@/types'

/**
 * Tracks the grade the teacher is currently viewing. Students don't use this
 * (their grade is implicit on the JWT) — it's only meaningful when the user
 * has multiple `gradeLevels`. Persisted to AsyncStorage so the choice survives
 * app restart.
 */
interface ActiveGradeContextValue {
  /** The grade currently being viewed. Empty string while loading. */
  activeGrade: string
  /** Full list of grades the teacher can switch between. Single-element for students. */
  availableGrades: string[]
  /** True when the user is a teacher with more than one assigned grade. */
  canSwitch: boolean
  /** Set the active grade. No-op if not in availableGrades. */
  setActiveGrade: (grade: string) => Promise<void>
  /** Re-read the user profile + active grade. Call after login. */
  refresh: () => Promise<void>
}

const ActiveGradeContext = createContext<ActiveGradeContextValue | undefined>(undefined)

export function ActiveGradeProvider({ children }: { children: ReactNode }) {
  const [activeGrade, setActiveGradeState] = useState<string>('')
  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student')

  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      const profile: UserProfile | null = raw ? JSON.parse(raw) : null
      if (!profile) {
        setActiveGradeState('')
        setAvailableGrades([])
        return
      }
      const grades = (profile.gradeLevels && profile.gradeLevels.length > 0)
        ? profile.gradeLevels
        : (profile.grade ? [profile.grade] : [])
      setAvailableGrades(grades)
      setRole(profile.role)
      // Restore previous selection if still valid; otherwise default to first grade
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_GRADE)
      const initial = stored && grades.includes(stored) ? stored : (grades[0] || '')
      setActiveGradeState(initial)
      if (initial && initial !== stored) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_GRADE, initial)
      }
    } catch {
      // Silent — leave state empty so screens can render their own loading state
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setActiveGrade = useCallback(async (grade: string) => {
    if (!availableGrades.includes(grade)) return
    setActiveGradeState(grade)
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_GRADE, grade)
  }, [availableGrades])

  const canSwitch = role === 'teacher' && availableGrades.length > 1

  return (
    <ActiveGradeContext.Provider value={{ activeGrade, availableGrades, canSwitch, setActiveGrade, refresh }}>
      {children}
    </ActiveGradeContext.Provider>
  )
}

export function useActiveGrade(): ActiveGradeContextValue {
  const ctx = useContext(ActiveGradeContext)
  if (!ctx) throw new Error('useActiveGrade must be used inside ActiveGradeProvider')
  return ctx
}

/**
 * Non-React helper for service-layer code (e.g. StudentAPI). Reads the active
 * grade directly from AsyncStorage. Returns null if the user is a student
 * (no override) or the value isn't set yet.
 */
export async function getActiveGradeForApi(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    const profile: UserProfile | null = raw ? JSON.parse(raw) : null
    if (!profile || profile.role !== 'teacher') return null
    const grades = profile.gradeLevels || []
    if (grades.length === 0) return null
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_GRADE)
    return stored && grades.includes(stored) ? stored : grades[0] || null
  } catch {
    return null
  }
}
