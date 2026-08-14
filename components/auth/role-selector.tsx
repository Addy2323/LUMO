'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ROLE_LIST, type Role } from '@/lib/roles'

/**
 * Account-type selector. Until real auth exists this also decides which
 * dashboard the mock session lands on after sign in.
 */
export function RoleSelector({
  value,
  onChange,
  disabled,
}: {
  value: Role
  onChange: (role: Role) => void
  disabled?: boolean
}) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0] as Role | undefined
        if (selected) onChange(selected)
      }}
      className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
      aria-label="Account type"
    >
      {ROLE_LIST.map((role) => (
        <ToggleGroupItem
          key={role.id}
          value={role.id}
          disabled={disabled}
          className="w-full min-w-0 shrink truncate"
        >
          {role.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
