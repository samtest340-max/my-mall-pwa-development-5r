'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Ellipsis,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wifi,
  X,
} from 'lucide-react'

const employees = [
  { initials: 'AM', name: 'Amina Mohammed', email: 'amina@greenbasket.ng', role: 'Manager', branches: 'Lekki, Ikeja', status: 'Active', login: 'Today, 8:42 AM', tone: 'bg-[#f5d9c8] text-[#8d4931]' },
  { initials: 'TO', name: 'Tunde Okafor', email: 'tunde@greenbasket.ng', role: 'Cashier', branches: 'Lekki', status: 'Active', login: 'Today, 8:15 AM', tone: 'bg-[#d9e7d7] text-[#39724a]' },
  { initials: 'CN', name: 'Chinwe Nwosu', email: 'chinwe@greenbasket.ng', role: 'Stock Keeper', branches: 'Ikeja', status: 'Active', login: 'Yesterday, 6:30 PM', tone: 'bg-[#dedcf4] text-[#5b5797]' },
  { initials: 'YA', name: 'Yusuf Abdullahi', email: 'yusuf@greenbasket.ng', role: 'Accountant', branches: 'All branches', status: 'Suspended', login: 'Sep 24, 2026', tone: 'bg-[#f2dfb5] text-[#93661e]' },
]

const roles = ['Owner', 'Manager', 'Cashier', 'Stock Keeper', 'Accountant']
const permissions = [
  ['Dashboard', 'View sales', 'View profit', 'View debtors'],
  ['POS', 'Make sales', 'Give discounts', 'Hold sales', 'Process returns', 'Void or delete sales'],
  ['Inventory', 'View products', 'Add/edit products', 'Change prices', 'See cost prices', 'Adjust stock', 'Stock-take'],
  ['Customers', 'View customers', 'Add/edit customers', 'View credit balances'],
  ['Credit', 'Sell on credit', 'Record debt payments', 'Override credit limit', 'Write off debt'],
]

function NavItem({ icon: Icon, label, active, badge, onClick }: { icon: typeof Store; label: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${active ? 'bg-[#eef5ee] text-[#34704a]' : 'text-[#65716b] hover:bg-[#f5f7f4]'}`}><Icon className="size-[18px]" /><span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-[#e5f0e5] px-2 py-0.5 text-[11px] text-[#3b7650]">{badge}</span>}</button>
}

export default function Page() {
  const [mobileNav, setMobileNav] = useState(false)
  const [active, setActive] = useState('Staff')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Owner')
  const [synced, setSynced] = useState(false)
  const filtered = useMemo(() => employees.filter((employee) => `${employee.name} ${employee.email} ${employee.role}`.toLowerCase().includes(query.toLowerCase())), [query])

  return <div className="min-h-screen bg-[#f7f9f6] text-[#1c2921]">
    <aside className={`fixed inset-y-0 left-0 z-20 flex w-[248px] flex-col border-r border-[#e7ebe5] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-8 flex items-center gap-2 px-2"><div className="flex size-9 items-center justify-center rounded-xl bg-[#387a4f] text-white"><ShoppingCart className="size-5" /></div><div><div className="font-bold tracking-[-0.03em]">My Mall</div><div className="text-[10px] text-[#87938b]">GREEN BASKET MART</div></div><button onClick={() => setMobileNav(false)} className="ml-auto lg:hidden"><X className="size-5" /></button></div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0aaa2]">Workspace</div>
      <nav className="flex flex-col gap-1"><NavItem icon={LayoutDashboard} label="Overview" /><NavItem icon={ShoppingCart} label="Point of Sale" /><NavItem icon={Package} label="Inventory" /><NavItem icon={Users} label="Customers" /><NavItem icon={CircleDollarSign} label="Credit & Debtors" /><NavItem icon={Store} label="Branches" /><NavItem icon={Users} label="Staff" active={active === 'Staff'} onClick={() => setActive('Staff')} /><NavItem icon={CreditCard} label="Expenses" /></nav>
      <div className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0aaa2]">Manage</div><nav className="flex flex-col gap-1"><NavItem icon={ShieldCheck} label="Roles & permissions" /><NavItem icon={Settings} label="Settings" /></nav>
      <div className="mt-auto rounded-2xl bg-[#f3f8f2] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#3d6e4b]"><Wifi className="size-3.5" /> Online</div><p className="mt-1 text-[11px] leading-4 text-[#748278]">All changes are synced automatically.</p></div>
    </aside>
    {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-10 bg-black/20 lg:hidden" />}
    <main className="lg:pl-[248px]"><header className="flex h-[72px] items-center justify-between border-b border-[#e7ebe5] bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="lg:hidden"><Menu className="size-5" /></button><div className="hidden text-sm text-[#8c978f] sm:block">Good morning, <span className="font-semibold text-[#27352c]">Samuel</span></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full bg-[#f3f7f2] px-3 py-2 text-xs text-[#587060] sm:flex"><span className="size-2 rounded-full bg-[#4e9b68]" /> Lekki branch <ChevronDown className="size-3" /></div><button className="relative rounded-full p-2 text-[#68766d] hover:bg-[#f4f6f3]"><Bell className="size-[19px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#e38a4b]" /></button><div className="flex size-9 items-center justify-center rounded-full bg-[#d9e7d7] text-xs font-bold text-[#39724a]">SA</div></div></header>
      <div className="mx-auto max-w-[1240px] px-5 py-7 sm:px-8"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#849087]"><span>Manage</span><ChevronRight className="size-3" /><span className="text-[#387a4f]">Staff</span></div><h1 className="text-[27px] font-bold tracking-[-0.04em] text-[#1d2b22]">Staff & access</h1><p className="mt-1 text-sm text-[#7d8980]">Manage your team and control what they can access.</p></div><button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#387a4f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#387a4f]/20 transition hover:bg-[#2e6842]"><Plus className="size-4" /> Add employee</button></div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-[#e8ece6] bg-white p-4"><div className="text-xs text-[#89958c]">Total employees</div><div className="mt-2 text-2xl font-bold">12</div><div className="mt-1 text-[11px] text-[#4d9563]">+2 this month</div></div><div className="rounded-2xl border border-[#e8ece6] bg-white p-4"><div className="text-xs text-[#89958c]">Active now</div><div className="mt-2 text-2xl font-bold">9</div><div className="mt-1 text-[11px] text-[#89958c]">Across 3 branches</div></div><div className="rounded-2xl border border-[#e8ece6] bg-white p-4"><div className="text-xs text-[#89958c]">Roles</div><div className="mt-2 text-2xl font-bold">5</div><div className="mt-1 text-[11px] text-[#89958c]">1 custom role</div></div><div className="rounded-2xl border border-[#e8ece6] bg-white p-4"><div className="text-xs text-[#89958c]">Pending sync</div><div className="mt-2 text-2xl font-bold">3</div><button onClick={() => setSynced(true)} className="mt-1 text-[11px] font-semibold text-[#4d9563]">{synced ? 'Synced just now' : 'Sync changes →'}</button></div></div>
        <div className="mb-5 flex gap-6 border-b border-[#e4e9e3] text-sm"><button className="border-b-2 border-[#387a4f] pb-3 font-semibold text-[#387a4f]">Employees</button><button className="pb-3 text-[#8a958d]">Roles & permissions</button></div>
        <div className="rounded-2xl border border-[#e8ece6] bg-white"><div className="flex flex-col gap-3 border-b border-[#edf0ec] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">All employees <span className="ml-1 rounded-full bg-[#f1f4f0] px-2 py-0.5 text-xs text-[#87928a]">12</span></h2></div><div className="flex gap-2"><div className="relative flex-1 sm:w-52"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a0aaa2]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" className="h-9 w-full rounded-lg border border-[#e5eae4] pl-9 pr-3 text-xs outline-none ring-[#a8c8ae] placeholder:text-[#a8b1aa] focus:ring-2" /></div><button className="rounded-lg border border-[#e5eae4] px-3 text-xs font-medium text-[#68766d]">Filter <ChevronDown className="ml-1 inline size-3" /></button></div></div><div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_32px] gap-4 bg-[#fbfcfa] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9aa49c] md:grid"><span>Employee</span><span>Role</span><span>Branch access</span><span>Status</span><span>Last login</span><span /></div><div>{filtered.map((employee) => <div key={employee.email} className="grid gap-3 border-t border-[#edf0ec] px-4 py-4 md:grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_32px] md:items-center md:gap-4 md:px-5"><div className="flex items-center gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${employee.tone}`}>{employee.initials}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{employee.name}</div><div className="truncate text-xs text-[#8d988f]">{employee.email}</div></div></div><div><span className="text-[10px] text-[#9aa49c] md:hidden">Role · </span><span className="text-sm text-[#59675e]">{employee.role}</span></div><div><span className="text-[10px] text-[#9aa49c] md:hidden">Branches · </span><span className="text-sm text-[#59675e]">{employee.branches}</span></div><div><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${employee.status === 'Active' ? 'bg-[#edf7ef] text-[#438157]' : 'bg-[#fff3e8] text-[#bb7041]'}`}><span className="size-1.5 rounded-full bg-current" />{employee.status}</span></div><div className="text-xs text-[#87928a]">{employee.login}</div><button aria-label={`More actions for ${employee.name}`} className="hidden text-[#98a39a] hover:text-[#387a4f] md:block"><MoreHorizontal className="size-4" /></button></div>)}</div></div>
        <div className="mt-8 rounded-2xl border border-[#e8ece6] bg-white p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Role templates</h2><p className="mt-1 text-xs text-[#89958c]">Set default permissions for each role in your business.</p></div><button className="flex items-center gap-1.5 rounded-lg border border-[#dfe6dd] px-3 py-2 text-xs font-semibold text-[#487054]"><Plus className="size-3.5" /> Custom role</button></div><div className="flex flex-wrap gap-2">{roles.map((role) => <button key={role} onClick={() => setSelectedRole(role)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedRole === role ? 'bg-[#eaf4ea] text-[#387a4f]' : 'bg-[#f6f8f5] text-[#7b887f]'}`}>{role}</button>)}</div><div className="mt-5 overflow-x-auto rounded-xl border border-[#edf0ec]"><div className="min-w-[620px]"><div className="grid grid-cols-[1.5fr_repeat(4,1fr)] bg-[#fbfcfa] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9aa49c]"><span>Permission</span><span className="text-center">Owner</span><span className="text-center">Manager</span><span className="text-center">Cashier</span><span className="text-center">{selectedRole}</span></div>{permissions.flatMap(([group, ...items]) => [<div key={group} className="col-span-5 border-t border-[#edf0ec] bg-[#fbfcfa] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#87958b]">{group}</div>, ...items.map((item) => <div key={item} className="grid grid-cols-[1.5fr_repeat(4,1fr)] border-t border-[#f0f2ef] px-4 py-2.5 text-xs"><span className="text-[#5f6c63]">{item}</span>{['Owner','Manager','Cashier',selectedRole].map((role) => <span key={role} className="flex justify-center"><input type="checkbox" defaultChecked={role === 'Owner' || (role === 'Manager' && !['See cost prices','Void or delete sales','Write off debt'].includes(item)) || (role === selectedRole && selectedRole === 'Owner')} className="size-3.5 accent-[#387a4f]" /></span>)}</div>)])}</div></div></div>
      </div>
    </main>
    {showAdd && <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#1d2b22]/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Add employee</h2><p className="mt-1 text-xs text-[#89958c]">Create a secure staff login for your business.</p></div><button onClick={() => setShowAdd(false)}><X className="size-5 text-[#8d988f]" /></button></div><div className="mt-5 flex flex-col gap-3"><input placeholder="Full name" className="h-10 rounded-lg border border-[#e2e9e0] px-3 text-sm outline-none focus:ring-2 focus:ring-[#b7d5bb]" /><input placeholder="Phone or email" className="h-10 rounded-lg border border-[#e2e9e0] px-3 text-sm outline-none focus:ring-2 focus:ring-[#b7d5bb]" /><select className="h-10 rounded-lg border border-[#e2e9e0] bg-white px-3 text-sm"><option>Cashier</option><option>Manager</option><option>Stock Keeper</option><option>Accountant</option></select><div className="flex gap-2"><input placeholder="Temporary password" type="password" className="h-10 min-w-0 flex-1 rounded-lg border border-[#e2e9e0] px-3 text-sm" /><button className="rounded-lg border border-[#dce6dc] px-3 text-xs font-semibold text-[#487054]">Generate</button></div><div className="rounded-lg bg-[#f1f7f0] p-3 text-xs leading-5 text-[#5d765f]">They will be asked to change this temporary password on their first login.</div><button onClick={() => setShowAdd(false)} className="mt-2 h-10 rounded-lg bg-[#387a4f] text-sm font-semibold text-white">Create employee</button></div></div></div>}
  </div>
}
