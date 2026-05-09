<template>
  <AdminLayout>
    <div class="finance">

      <!-- Header -->
      <div class="finance__header">
        <div class="finance__header-left">
          <div class="finance__icon">
            <i class="fa-sharp-duotone fa-solid fa-chart-mixed-up-circle-dollar"></i>
          </div>
          <div>
            <h1>Financial Reports</h1>
            <p>Ledger-backed statements generated in real time</p>
          </div>
        </div>
        <div class="finance__header-right">
          <div class="date-range">
            <div class="date-field">
              <label>From</label>
              <input type="date" v-model="fromDate" @change="loadActive" />
            </div>
            <div class="date-sep"><i class="fa-sharp-duotone fa-solid fa-arrow-right"></i></div>
            <div class="date-field">
              <label>To</label>
              <input type="date" v-model="toDate" @change="loadActive" />
            </div>
          </div>
        </div>
      </div>

      <!-- Report Tabs -->
      <div class="report-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['report-tab', { active: activeTab === tab.key }]"
          @click="switchTab(tab.key)"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-loading">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
        Generating report...
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-error">
        <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
        {{ error }}
      </div>

      <template v-else-if="report">

        <!-- Report Header Bar -->
        <div class="report-bar">
          <div class="report-bar__meta">
            <span class="report-bar__title">{{ activeTabObj.label }}</span>
            <span class="report-bar__date">Generated {{ formatDateTime(report.generated_at) }}</span>
            <span v-if="report.period_from" class="report-bar__period">
              {{ formatDate(report.period_from) }} to {{ formatDate(report.period_to) }}
            </span>
            <span v-if="report.as_of" class="report-bar__period">As of {{ formatDate(report.as_of) }}</span>
          </div>
          <div class="report-bar__actions">
            <button class="export-btn export-btn--excel" @click="exportExcel" :disabled="exporting">
              <i class="fa-sharp-duotone fa-solid fa-file-excel"></i>
              Excel
            </button>
            <button class="export-btn export-btn--pdf" @click="exportPdf" :disabled="exporting">
              <i class="fa-sharp-duotone fa-solid fa-file-pdf"></i>
              PDF
            </button>
          </div>
        </div>

        <!-- ── TRIAL BALANCE ─────────────────────────────────────────────── -->
        <div v-if="activeTab === 'trial-balance'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Trial Balance</div>
            <div class="rph__sub">{{ report.as_of ? 'As of ' + formatDate(report.as_of) : 'All periods' }}</div>
          </div>

          <!-- Summary cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-card__label">Total Debits</div>
              <div class="summary-card__value">{{ formatMoney(trialTotals.debits) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card__label">Total Credits</div>
              <div class="summary-card__value">{{ formatMoney(trialTotals.credits) }}</div>
            </div>
            <div class="summary-card" :class="trialTotals.balanced ? 'summary-card--balanced' : 'summary-card--unbalanced'">
              <div class="summary-card__label">Balance Check</div>
              <div class="summary-card__value">
                <i :class="trialTotals.balanced ? 'fa-sharp-duotone fa-solid fa-check-circle' : 'fa-sharp-duotone fa-solid fa-exclamation-circle'"></i>
                {{ trialTotals.balanced ? 'Balanced' : 'Unbalanced' }}
              </div>
            </div>
          </div>

          <!-- Grouped by category -->
          <div v-for="(accounts, category) in groupedTrialAccounts" :key="category" class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">{{ getCategoryLabel(category) }}</span>
              <span class="account-group__count">{{ accounts.length }} accounts</span>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th class="text-right">Debit</th>
                  <th class="text-right">Credit</th>
                  <th class="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in accounts" :key="acc.id" :class="{ 'row--active': acc.balance != 0 }">
                  <td class="mono">{{ acc.code }}</td>
                  <td><span class="type-chip" :class="`type-chip--${acc.type}`">{{ acc.type }}</span></td>
                  <td class="mono">{{ acc.currency_code }}</td>
                  <td class="text-right mono">{{ formatMoney(acc.debit_balance) }}</td>
                  <td class="text-right mono">{{ formatMoney(acc.credit_balance) }}</td>
                  <td class="text-right mono" :class="acc.balance > 0 ? 'positive' : acc.balance < 0 ? 'negative' : ''">
                    {{ formatMoney(acc.balance) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="subtotal-row">
                  <td colspan="3">Subtotal</td>
                  <td class="text-right mono">{{ formatMoney(accounts.reduce((s,a) => s + parseFloat(a.debit_balance||0), 0)) }}</td>
                  <td class="text-right mono">{{ formatMoney(accounts.reduce((s,a) => s + parseFloat(a.credit_balance||0), 0)) }}</td>
                  <td class="text-right mono">{{ formatMoney(accounts.reduce((s,a) => s + parseFloat(a.balance||0), 0)) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- ── BALANCE SHEET ──────────────────────────────────────────────── -->
        <div v-if="activeTab === 'balance-sheet'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Balance Sheet</div>
            <div class="rph__sub">As of {{ formatDate(report.as_of) }}</div>
          </div>

          <div class="bs-grid">
            <!-- Assets -->
            <div class="bs-section">
              <div class="bs-section__header bs-section__header--asset">
                <i class="fa-sharp-duotone fa-solid fa-building-columns"></i>
                Assets
              </div>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Currency</th>
                    <th class="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="acc in report.sections?.asset?.accounts" :key="acc.id">
                    <td class="mono">{{ acc.code }}</td>
                    <td class="mono">{{ acc.currency_code }}</td>
                    <td class="text-right mono positive">{{ formatMoney(acc.balance) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row total-row--asset">
                    <td colspan="2">Total Assets</td>
                    <td class="text-right mono">{{ formatMoney(report.sections?.asset?.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Liabilities + Equity -->
            <div class="bs-right">
              <div class="bs-section">
                <div class="bs-section__header bs-section__header--liability">
                  <i class="fa-sharp-duotone fa-solid fa-scale-unbalanced"></i>
                  Liabilities
                </div>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Currency</th>
                      <th class="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="acc in report.sections?.liability?.accounts" :key="acc.id">
                      <td class="mono">{{ acc.code }}</td>
                      <td class="mono">{{ acc.currency_code }}</td>
                      <td class="text-right mono">{{ formatMoney(acc.balance) }}</td>
                    </tr>
                    <tr v-if="!report.sections?.liability?.accounts?.length">
                      <td colspan="3" class="table-empty">No liabilities</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row total-row--liability">
                      <td colspan="2">Total Liabilities</td>
                      <td class="text-right mono">{{ formatMoney(report.sections?.liability?.total) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="bs-section" style="margin-top:12px">
                <div class="bs-section__header bs-section__header--equity">
                  <i class="fa-sharp-duotone fa-solid fa-coins"></i>
                  Equity
                </div>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Currency</th>
                      <th class="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="acc in report.sections?.equity?.accounts" :key="acc.id">
                      <td class="mono">{{ acc.code }}</td>
                      <td class="mono">{{ acc.currency_code }}</td>
                      <td class="text-right mono">{{ formatMoney(acc.balance) }}</td>
                    </tr>
                    <tr v-if="!report.sections?.equity?.accounts?.length">
                      <td colspan="3" class="table-empty">No equity accounts</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row total-row--equity">
                      <td colspan="2">Total Equity</td>
                      <td class="text-right mono">{{ formatMoney(report.sections?.equity?.total) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Accounting equation check -->
              <div class="equation-check" :class="equationBalanced ? 'equation-check--ok' : 'equation-check--fail'">
                <i :class="equationBalanced ? 'fa-sharp-duotone fa-solid fa-check-circle' : 'fa-sharp-duotone fa-solid fa-exclamation-circle'"></i>
                Assets = Liabilities + Equity
                <span class="equation-check__values">
                  {{ formatMoney(report.sections?.asset?.total) }} =
                  {{ formatMoney((parseFloat(report.sections?.liability?.total||0) + parseFloat(report.sections?.equity?.total||0)).toFixed(6)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PROFIT AND LOSS ────────────────────────────────────────────── -->
        <div v-if="activeTab === 'profit-loss'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Profit and Loss Statement</div>
            <div class="rph__sub">{{ formatDate(report.period_from) }} to {{ formatDate(report.period_to) }}</div>
          </div>

          <!-- P&L summary -->
          <div class="pnl-summary">
            <div class="pnl-card pnl-card--revenue">
              <div class="pnl-card__icon"><i class="fa-sharp-duotone fa-solid fa-arrow-trend-up"></i></div>
              <div>
                <div class="pnl-card__label">Total Revenue</div>
                <div class="pnl-card__value">{{ formatMoney(report.totals?.total_revenue) }}</div>
              </div>
            </div>
            <div class="pnl-card pnl-card--expense">
              <div class="pnl-card__icon"><i class="fa-sharp-duotone fa-solid fa-arrow-trend-down"></i></div>
              <div>
                <div class="pnl-card__label">Total Expenses</div>
                <div class="pnl-card__value">{{ formatMoney(report.totals?.total_expenses) }}</div>
              </div>
            </div>
            <div class="pnl-card" :class="report.totals?.is_profitable ? 'pnl-card--profit' : 'pnl-card--loss'">
              <div class="pnl-card__icon">
                <i :class="report.totals?.is_profitable ? 'fa-sharp-duotone fa-solid fa-sack-dollar' : 'fa-sharp-duotone fa-solid fa-sack-xmark'"></i>
              </div>
              <div>
                <div class="pnl-card__label">Net {{ report.totals?.is_profitable ? 'Profit' : 'Loss' }}</div>
                <div class="pnl-card__value">{{ formatMoney(report.totals?.net_profit) }}</div>
              </div>
            </div>
          </div>

          <!-- Revenue section -->
          <div class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">Revenue</span>
              <span class="account-group__total positive">{{ formatMoney(report.sections?.income?.total) }}</span>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Currency</th>
                  <th class="text-right">Credits</th>
                  <th class="text-right">Debits</th>
                  <th class="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in report.sections?.income?.accounts" :key="acc.id">
                  <td class="mono">{{ acc.code }}</td>
                  <td class="mono">{{ acc.currency_code }}</td>
                  <td class="text-right mono positive">{{ formatMoney(acc.credit_total) }}</td>
                  <td class="text-right mono">{{ formatMoney(acc.debit_total) }}</td>
                  <td class="text-right mono positive">{{ formatMoney(acc.net_movement) }}</td>
                </tr>
                <tr v-if="!report.sections?.income?.accounts?.length">
                  <td colspan="5" class="table-empty">No revenue in this period</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Expense section -->
          <div class="account-group" style="margin-top:16px">
            <div class="account-group__header">
              <span class="account-group__title">Expenses</span>
              <span class="account-group__total negative">{{ formatMoney(report.sections?.expense?.total) }}</span>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Currency</th>
                  <th class="text-right">Debits</th>
                  <th class="text-right">Credits</th>
                  <th class="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in report.sections?.expense?.accounts" :key="acc.id">
                  <td class="mono">{{ acc.code }}</td>
                  <td class="mono">{{ acc.currency_code }}</td>
                  <td class="text-right mono negative">{{ formatMoney(acc.debit_total) }}</td>
                  <td class="text-right mono">{{ formatMoney(acc.credit_total) }}</td>
                  <td class="text-right mono negative">{{ formatMoney(acc.net_movement) }}</td>
                </tr>
                <tr v-if="!report.sections?.expense?.accounts?.length">
                  <td colspan="5" class="table-empty">No expenses recorded in this period</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── CASH FLOW ──────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'cash-flow'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Cash Flow Statement</div>
            <div class="rph__sub">{{ formatDate(report.period_from) }} to {{ formatDate(report.period_to) }}</div>
          </div>

          <!-- Net cash summary -->
          <div class="cf-summary">
            <div v-for="(activity, key) in report.activities" :key="key" class="cf-summary-card">
              <div class="cf-summary-card__label">{{ activity.label }}</div>
              <div class="cf-summary-card__value" :class="parseFloat(activity.net_flow||0) >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(activity.net_flow) }}
              </div>
            </div>
            <div class="cf-summary-card cf-summary-card--total">
              <div class="cf-summary-card__label">Net Cash Movement</div>
              <div class="cf-summary-card__value" :class="parseFloat(report.net_cash_flow||0) >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(report.net_cash_flow) }}
              </div>
            </div>
          </div>

          <!-- Activity sections -->
          <div v-for="(activity, key) in report.activities" :key="key" class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">{{ activity.label }}</span>
              <span class="account-group__total" :class="parseFloat(activity.net_flow||0) >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(activity.net_flow) }}
              </span>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Currency</th>
                  <th class="text-right">Transactions</th>
                  <th class="text-right">Inflows</th>
                  <th class="text-right">Outflows</th>
                  <th class="text-right">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in activity.items" :key="`${item.group_type}-${item.currency_code}`">
                  <td>{{ formatGroupType(item.group_type) }}</td>
                  <td class="mono">{{ item.currency_code }}</td>
                  <td class="text-right mono">{{ item.transaction_count }}</td>
                  <td class="text-right mono positive">{{ formatMoney(item.total_credits) }}</td>
                  <td class="text-right mono negative">{{ formatMoney(item.total_debits) }}</td>
                  <td class="text-right mono" :class="parseFloat(item.net_flow) >= 0 ? 'positive' : 'negative'">
                    {{ formatMoney(item.net_flow) }}
                  </td>
                </tr>
                <tr v-if="!activity.items?.length">
                  <td colspan="6" class="table-empty">No activity in this period</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'
import * as XLSX from 'xlsx'

const ui       = useUiStore()
const report   = ref(null)
const loading  = ref(false)
const exporting = ref(false)
const error    = ref(null)
const reportEl = ref(null)
const activeTab = ref('trial-balance')

const today  = new Date().toISOString().split('T')[0]
const janFirst = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
const fromDate = ref(janFirst)
const toDate   = ref(today)

const tabs = [
  { key: 'trial-balance', label: 'Trial Balance',  icon: 'fa-sharp-duotone fa-solid fa-scale-balanced' },
  { key: 'balance-sheet', label: 'Balance Sheet',  icon: 'fa-sharp-duotone fa-solid fa-building-columns' },
  { key: 'profit-loss',   label: 'Profit & Loss',  icon: 'fa-sharp-duotone fa-solid fa-chart-line' },
  { key: 'cash-flow',     label: 'Cash Flow',      icon: 'fa-sharp-duotone fa-solid fa-water' },
]

const activeTabObj = computed(() => tabs.find(t => t.key === activeTab.value))

// ── Trial Balance helpers ────────────────────────────────────────────────────
const groupedTrialAccounts = computed(() => {
  if (!report.value?.accounts) return {}
  return report.value.accounts.reduce((groups, acc) => {
    const cat = acc.category || 'other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(acc)
    return groups
  }, {})
})

const trialTotals = computed(() => {
  const accounts = report.value?.accounts || []
  const debits  = accounts.reduce((s, a) => s + parseFloat(a.debit_balance || 0), 0)
  const credits = accounts.reduce((s, a) => s + parseFloat(a.credit_balance || 0), 0)
  return { debits, credits, balanced: Math.abs(debits - credits) < 0.01 }
})

// ── Balance Sheet helpers ────────────────────────────────────────────────────
const equationBalanced = computed(() => {
  if (!report.value?.sections) return false
  const assets = parseFloat(report.value.sections.asset?.total || 0)
  const liab   = parseFloat(report.value.sections.liability?.total || 0)
  const equity = parseFloat(report.value.sections.equity?.total || 0)
  return Math.abs(assets - (liab + equity)) < 0.01
})

// ── Formatters ───────────────────────────────────────────────────────────────
function formatMoney(v) {
  return Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function getCategoryLabel(cat) {
  return { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', income: 'Revenue', expense: 'Expenses' }[cat] || cat
}
function formatGroupType(t) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadActive() {
  loading.value = true
  error.value   = null
  report.value  = null
  try {
    const params = { from: fromDate.value, to: toDate.value }
    const map = {
      'trial-balance': () => adminApi.reportTrialBalance(),
      'balance-sheet': () => adminApi.reportBalanceSheet(),
      'profit-loss':   () => adminApi.reportProfitLoss(params),
      'cash-flow':     () => adminApi.reportCashFlow(params),
    }
    const { data } = await map[activeTab.value]()
    report.value = data.report
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load report'
  } finally {
    loading.value = false
  }
}

function switchTab(key) {
  activeTab.value = key
  loadActive()
}

// ── Export PDF ───────────────────────────────────────────────────────────────
async function exportPdf() {
  if (!reportEl.value) return
  exporting.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(reportEl.value, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW  = pageW - 20
    const imgH  = (canvas.height * imgW) / canvas.width
    let y = 10
    let remaining = imgH
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
      remaining -= (pageH - 20)
      if (remaining > 0) { pdf.addPage(); y = 10 - (imgH - remaining) }
    }
    pdf.save(`${activeTab.value}-${fromDate.value}-${toDate.value}.pdf`)
    ui.success('PDF exported')
  } catch (e) {
    ui.error('PDF export failed')
  } finally {
    exporting.value = false
  }
}

// ── Export Excel ─────────────────────────────────────────────────────────────
function exportExcel() {
  if (!report.value) return
  exporting.value = true
  try {
    const wb = XLSX.utils.book_new()
    const tab = activeTab.value

    if (tab === 'trial-balance') {
      const rows = [['Account Code', 'Type', 'Currency', 'Category', 'Debit', 'Credit', 'Balance']]
      for (const acc of report.value.accounts || []) {
        rows.push([acc.code, acc.type, acc.currency_code, acc.category, acc.debit_balance, acc.credit_balance, acc.balance])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Trial Balance')
    }

    if (tab === 'balance-sheet') {
      const rows = [['Section', 'Account Code', 'Type', 'Currency', 'Balance']]
      for (const [section, data] of Object.entries(report.value.sections || {})) {
        for (const acc of data.accounts || []) {
          rows.push([section, acc.code, acc.type, acc.currency_code, acc.balance])
        }
        rows.push([`Total ${section}`, '', '', '', data.total])
        rows.push([])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Balance Sheet')
    }

    if (tab === 'profit-loss') {
      const rows = [['Section', 'Account Code', 'Currency', 'Credits', 'Debits', 'Net Movement']]
      for (const [section, data] of Object.entries(report.value.sections || {})) {
        for (const acc of data.accounts || []) {
          rows.push([section, acc.code, acc.currency_code, acc.credit_total, acc.debit_total, acc.net_movement])
        }
        rows.push([`Total ${section}`, '', '', '', '', data.total])
        rows.push([])
      }
      rows.push(['Net Profit', '', '', '', '', report.value.totals?.net_profit])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Profit and Loss')
    }

    if (tab === 'cash-flow') {
      const rows = [['Activity', 'Group Type', 'Currency', 'Transactions', 'Inflows', 'Outflows', 'Net Flow']]
      for (const [key, activity] of Object.entries(report.value.activities || {})) {
        for (const item of activity.items || []) {
          rows.push([activity.label, item.group_type, item.currency_code, item.transaction_count, item.total_credits, item.total_debits, item.net_flow])
        }
        rows.push([`Net ${activity.label}`, '', '', '', '', '', activity.net_flow])
        rows.push([])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Cash Flow')
    }

    XLSX.writeFile(wb, `${tab}-${fromDate.value}-${toDate.value}.xlsx`)
    ui.success('Excel exported')
  } catch (e) {
    ui.error('Excel export failed')
  } finally {
    exporting.value = false
  }
}

onMounted(loadActive)
</script>

<style scoped>
.finance { padding: 20px; max-width: 1200px; }
@media (min-width: 768px) { .finance { padding: 32px; } }

/* Header */
.finance__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
}
.finance__header-left { display: flex; align-items: center; gap: 16px; }
.finance__icon {
  width: 48px; height: 48px; background: linear-gradient(135deg, #1B4F8A, #2563eb);
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px; flex-shrink: 0;
}
.finance__header h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.finance__header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

/* Date range */
.date-range { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.date-field { display: flex; flex-direction: column; gap: 4px; }
.date-field label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.date-field input {
  padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 13px; color: #1e293b; background: var(--bg-card); outline: none;
}
.date-field input:focus { border-color: #2563eb; }
.date-sep { color: #94a3b8; font-size: 12px; margin-top: 18px; }

/* Tabs */
.report-tabs {
  display: flex; gap: 4px; margin-bottom: 20px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 4px; flex-wrap: wrap;
}
.report-tab {
  flex: 1; min-width: 120px; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 10px 16px; border: none; background: transparent;
  border-radius: 9px; font-size: 13px; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.report-tab.active { background: #1B4F8A; color: #fff; }
.report-tab:not(.active):hover { background: #f1f5f9; color: #1e293b; }

/* Report bar */
.report-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
.report-bar__meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.report-bar__title { font-size: 14px; font-weight: 700; color: #0f172a; }
.report-bar__date  { font-size: 12px; color: #94a3b8; }
.report-bar__period { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
.report-bar__actions { display: flex; gap: 8px; }

.export-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.export-btn--excel { background: #166534; color: #fff; }
.export-btn--excel:not(:disabled):hover { background: #14532d; }
.export-btn--pdf { background: #dc2626; color: #fff; }
.export-btn--pdf:not(:disabled):hover { background: #b91c1c; }

/* Report content */
.report-content {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
}

/* Print header */
.report-print-header {
  padding: 20px 24px 16px; border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
}
.rph__title { font-size: 18px; font-weight: 800; color: #0f172a; }
.rph__sub   { font-size: 12px; color: #64748b; margin-top: 4px; }

/* Summary cards */
.summary-cards {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px; background: #f1f5f9; border-bottom: 1px solid #f1f5f9;
}
.summary-card {
  padding: 20px 24px; background: var(--bg-card);
}
.summary-card__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.summary-card__value { font-size: 20px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.summary-card--balanced .summary-card__value { color: #16a34a; }
.summary-card--unbalanced .summary-card__value { color: #dc2626; }

/* Account groups */
.account-group { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.account-group:last-child { border-bottom: none; }
.account-group__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.account-group__title { font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.04em; }
.account-group__count { font-size: 11px; color: #94a3b8; }
.account-group__total { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Report table */
.report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.report-table th {
  padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700;
  color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
  background: #f8fafc; border-bottom: 1px solid #f1f5f9;
}
.report-table td {
  padding: 10px 12px; border-bottom: 1px solid #f8fafc; color: #374151; vertical-align: middle;
}
.report-table tr:last-child td { border-bottom: none; }
.report-table tbody tr:hover td { background: #f8fafc; }
.row--active td { background: #fefce8; }

.subtotal-row td, .total-row td {
  padding: 10px 12px; font-weight: 700; color: #0f172a;
  background: #f8fafc; border-top: 2px solid #e2e8f0; font-size: 12px;
}
.total-row--asset td  { color: #166534; }
.total-row--liability td { color: #9a3412; }
.total-row--equity td { color: #1d4ed8; }

.text-right { text-align: right; }
.mono { font-family: 'Courier New', monospace; font-size: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }

/* Type chips */
.type-chip {
  display: inline-block; padding: 2px 7px; border-radius: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
}
.type-chip--user_wallet { background: #eff6ff; color: #1d4ed8; }
.type-chip--escrow      { background: #f0fdf4; color: #166534; }
.type-chip--fee         { background: #fef3c7; color: #92400e; }
.type-chip--guarantee   { background: #faf5ff; color: #7c3aed; }
.type-chip--partner     { background: #fff1f2; color: #be123c; }
.type-chip--system      { background: #f1f5f9; color: #475569; }

/* Balance sheet */
.bs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
@media (max-width: 768px) { .bs-grid { grid-template-columns: 1fr; } }
.bs-section { padding: 20px 24px; }
.bs-right { border-left: 1px solid #f1f5f9; }
.bs-section__header {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; margin-bottom: 12px; padding: 10px 14px;
  border-radius: 8px;
}
.bs-section__header--asset     { background: #f0fdf4; color: #166534; }
.bs-section__header--liability { background: #fff1f2; color: #be123c; }
.bs-section__header--equity    { background: #eff6ff; color: #1d4ed8; }

.equation-check {
  margin: 16px 0 0; padding: 12px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px;
}
.equation-check--ok   { background: #f0fdf4; color: #166534; }
.equation-check--fail { background: #fff1f2; color: #dc2626; }
.equation-check__values { margin-left: auto; font-size: 12px; font-family: monospace; }

/* P&L */
.pnl-summary {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px; background: #f1f5f9; border-bottom: 1px solid #f1f5f9;
}
.pnl-card {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 24px; background: var(--bg-card);
}
.pnl-card__icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.pnl-card--revenue .pnl-card__icon { background: #f0fdf4; color: #16a34a; }
.pnl-card--expense .pnl-card__icon { background: #fff1f2; color: #dc2626; }
.pnl-card--profit .pnl-card__icon  { background: #eff6ff; color: #2563eb; }
.pnl-card--loss .pnl-card__icon    { background: #fef3c7; color: #92400e; }
.pnl-card__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.pnl-card__value { font-size: 18px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }

/* Cash flow */
.cf-summary {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1px; background: #f1f5f9; border-bottom: 1px solid #f1f5f9;
}
.cf-summary-card { padding: 18px 24px; background: var(--bg-card); }
.cf-summary-card--total { background: #f8fafc; }
.cf-summary-card__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.cf-summary-card__value { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* States */
.state-loading, .state-error {
  display: flex; align-items: center; gap: 12px;
  padding: 48px 24px; color: #94a3b8; font-size: 14px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px;
}
.state-error { color: #dc2626; }
.table-empty { padding: 20px; text-align: center; color: #94a3b8; font-style: italic; }
</style>
