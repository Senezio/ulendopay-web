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
              <label>Currency</label>
              <select v-model="filterCurrency" @change="loadActive" class="currency-select">
                <option value="">All</option>
                <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="date-sep"><i class="fa-sharp-duotone fa-solid fa-arrow-right"></i></div>
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

          <div v-for="(accounts, category) in groupedTrialAccounts" :key="category" class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">{{ getCategoryLabel(category) }}</span>
              <span class="account-group__count">{{ accounts.length }} accounts</span>
            </div>
            <div class="table-scroll"><table class="report-table">
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
            </table></div>
          </div>
        </div>

        <!-- ── BALANCE SHEET ──────────────────────────────────────────────── -->
        <div v-if="activeTab === 'balance-sheet'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Balance Sheet</div>
            <div class="rph__sub">As of {{ formatDate(report.as_of) }}</div>
          </div>

          <!-- Ledger integrity check -->
          <div class="ledger-check" :class="report.ledger_balanced ? 'ledger-check--ok' : 'ledger-check--fail'">
            <i :class="report.ledger_balanced ? 'fa-sharp-duotone fa-solid fa-check-circle' : 'fa-sharp-duotone fa-solid fa-exclamation-circle'"></i>
            <span>Ledger integrity: <strong>{{ report.ledger_balanced ? 'Balanced' : 'Unbalanced' }}</strong></span>
            <span class="ledger-check__sum">Raw sum of all balances: {{ report.ledger_sum }}</span>
          </div>

          <!-- Per-currency blocks -->
          <div
            v-for="block in activeCurrencyBlocks"
            :key="block.currency"
            class="currency-block"
          >
            <div class="currency-block__header">
              <div class="currency-badge">{{ block.currency }}</div>
              <div class="currency-block__eq" :class="block.totals.equation_balanced ? 'eq--ok' : 'eq--fail'">
                <i :class="block.totals.equation_balanced ? 'fa-sharp-duotone fa-solid fa-check' : 'fa-sharp-duotone fa-solid fa-xmark'"></i>
                {{ block.totals.equation_balanced ? 'Balanced' : 'Unbalanced' }}
              </div>
            </div>

            <div class="bs-grid">
              <!-- Assets -->
              <div class="bs-section">
                <div class="bs-section__header bs-section__header--asset">
                  <i class="fa-sharp-duotone fa-solid fa-building-columns"></i>
                  Assets
                </div>
                <div class="table-scroll"><table class="report-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th class="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="acc in block.sections.asset.accounts" :key="acc.id">
                      <td class="mono">{{ acc.code }}</td>
                      <td class="text-right mono positive">{{ formatMoney(acc.balance) }}</td>
                    </tr>
                    <tr v-if="!block.sections.asset.accounts.length">
                      <td colspan="2" class="table-empty">No asset accounts</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row total-row--asset">
                      <td>Total Assets</td>
                      <td class="text-right mono">{{ formatMoney(block.totals.total_assets) }}</td>
                    </tr>
                  </tfoot>
                </table></div>
              </div>

              <!-- Liabilities + Equity -->
              <div class="bs-right">
                <div class="bs-section">
                  <div class="bs-section__header bs-section__header--liability">
                    <i class="fa-sharp-duotone fa-solid fa-scale-unbalanced"></i>
                    Liabilities
                  </div>
                  <div class="table-scroll"><table class="report-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th class="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="acc in block.sections.liability.accounts" :key="acc.id" :class="{ 'row--active': parseFloat(acc.balance) !== 0 }">
                        <td class="mono">{{ acc.code }}</td>
                        <td class="text-right mono" :class="parseFloat(acc.balance) < 0 ? 'negative' : 'positive'">
                          {{ formatMoney(acc.balance) }}
                        </td>
                      </tr>
                      <tr v-if="!block.sections.liability.accounts.length">
                        <td colspan="2" class="table-empty">No liabilities</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="total-row total-row--liability">
                        <td>Total Liabilities</td>
                        <td class="text-right mono">{{ formatMoney(block.totals.total_liabilities) }}</td>
                      </tr>
                    </tfoot>
                  </table></div>
                </div>

                <div class="bs-section" style="margin-top:12px">
                  <div class="bs-section__header bs-section__header--equity">
                    <i class="fa-sharp-duotone fa-solid fa-coins"></i>
                    Equity (incl. retained earnings)
                  </div>
                  <div class="table-scroll"><table class="report-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th class="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="acc in block.sections.equity.accounts" :key="acc.id" :class="{ 'row--active': parseFloat(acc.balance) !== 0 }">
                        <td class="mono">
                          {{ acc.code }}
                          <span v-if="acc.type === 'fee'" class="retained-tag">retained earnings</span>
                        </td>
                        <td class="text-right mono positive">{{ formatMoney(acc.balance) }}</td>
                      </tr>
                      <tr v-if="!block.sections.equity.accounts.length">
                        <td colspan="2" class="table-empty">No equity accounts</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="total-row total-row--equity">
                        <td>Total Equity</td>
                        <td class="text-right mono">{{ formatMoney(block.totals.total_equity) }}</td>
                      </tr>
                    </tfoot>
                  </table></div>
                </div>

                <!-- Equation check -->
                <div class="equation-check" :class="block.totals.equation_balanced ? 'equation-check--ok' : 'equation-check--fail'">
                  <i :class="block.totals.equation_balanced ? 'fa-sharp-duotone fa-solid fa-check-circle' : 'fa-sharp-duotone fa-solid fa-exclamation-circle'"></i>
                  Assets = Liabilities + Equity
                  <span class="equation-check__values">
                    {{ formatMoney(block.totals.total_assets) }} =
                    {{ formatMoney(block.totals.total_liabilities_equity) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!activeCurrencyBlocks.length" class="table-empty" style="padding:40px; text-align:center;">
            No balance sheet data available
          </div>
        </div>

        <!-- ── PROFIT AND LOSS ────────────────────────────────────────────── -->
        <div v-if="activeTab === 'profit-loss'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Profit and Loss Statement</div>
            <div class="rph__sub">{{ formatDate(report.period_from) }} to {{ formatDate(report.period_to) }}</div>
          </div>

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

          <div class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">Revenue</span>
              <span class="account-group__total positive">{{ formatMoney(report.sections?.income?.total) }}</span>
            </div>
            <div class="table-scroll"><table class="report-table">
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
            </table></div>
          </div>

          <div class="account-group" style="margin-top:16px">
            <div class="account-group__header">
              <span class="account-group__title">Expenses</span>
              <span class="account-group__total negative">{{ formatMoney(report.sections?.expense?.total) }}</span>
            </div>
            <div class="table-scroll"><table class="report-table">
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
            </table></div>
          </div>
        </div>

        <!-- ── CASH FLOW ──────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'cash-flow'" class="report-content" ref="reportEl">
          <div class="report-print-header">
            <div class="rph__title">Cash Flow Statement</div>
            <div class="rph__sub">{{ formatDate(report.period_from) }} to {{ formatDate(report.period_to) }}</div>
          </div>

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

          <div v-for="(activity, key) in report.activities" :key="key" class="account-group">
            <div class="account-group__header">
              <span class="account-group__title">{{ activity.label }}</span>
              <span class="account-group__total" :class="parseFloat(activity.net_flow||0) >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(activity.net_flow) }}
              </span>
            </div>
            <div class="table-scroll"><table class="report-table">
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
            </table></div>
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

const today    = new Date().toISOString().split('T')[0]
const janFirst = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
const fromDate = ref(janFirst)
const toDate   = ref(today)
const filterCurrency = ref('')
const currencies = ['MWK','KES','TZS','ZMW','ZAR','MZN','ETB','MGA','BWP','USD','GBP','EUR']

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
// Only show currency blocks that have non-zero activity
const activeCurrencyBlocks = computed(() => {
  if (!report.value?.by_currency) return []
  return report.value.by_currency.filter(block => {
    const l = parseFloat(block.totals.total_liabilities || 0)
    const e = parseFloat(block.totals.total_equity || 0)
    return Math.abs(l) > 0.001 || Math.abs(e) > 0.001
  })
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
    const ccy = filterCurrency.value || null
    const params = { from: fromDate.value, to: toDate.value, ...(ccy ? { currency: ccy } : {}) }
    const map = {
      'trial-balance': () => adminApi.reportTrialBalance(params),
      'balance-sheet': () => adminApi.reportBalanceSheet(params),
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
  if (!report.value) return
  exporting.value = true
  try {
    const { jsPDF } = await import('jspdf')

    const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pW     = pdf.internal.pageSize.getWidth()   // 210
    const pH     = pdf.internal.pageSize.getHeight()  // 297
    const margin = 18
    const col1   = margin
    const col2   = pW - margin
    let y        = margin

    // ── Helper functions ──────────────────────────────────────────────────
    function checkPage(needed = 8) {
      if (y + needed > pH - 20) { pdf.addPage(); y = margin }
    }

    function drawHeader() {
      // Logo
      const img = new Image()
      img.src = '/logo.png'
      try { pdf.addImage(img, 'PNG', col1, y, 32, 10) } catch(e) {}

      // Company info top right
      pdf.setFontSize(7).setTextColor(100)
      pdf.text('Ulendo Technologies Limited', col2, y + 2, { align: 'right' })
      pdf.text('P.O. Box 37894, Lilongwe 3, Malawi', col2, y + 5.5, { align: 'right' })
      pdf.text('www.ulendopay.com  |  support@ulendopay.com', col2, y + 9, { align: 'right' })

      y += 14
      // Divider
      pdf.setDrawColor(200).setLineWidth(0.3).line(col1, y, col2, y)
      y += 6

      // Report title
      pdf.setFontSize(14).setFont('helvetica', 'bold').setTextColor(15, 30, 60)
      const titles = {
        'trial-balance': 'TRIAL BALANCE',
        'balance-sheet': 'STATEMENT OF FINANCIAL POSITION',
        'profit-loss':   'PROFIT AND LOSS STATEMENT',
        'cash-flow':     'CASH FLOW STATEMENT',
      }
      pdf.text(titles[activeTab.value] || activeTab.value.toUpperCase(), col1, y)
      y += 6

      // Period / as-of
      pdf.setFontSize(8).setFont('helvetica', 'normal').setTextColor(100)
      if (report.value.as_of)
        pdf.text(`As of ${formatDate(report.value.as_of)}`, col1, y)
      else if (report.value.period_from)
        pdf.text(`${formatDate(report.value.period_from)} to ${formatDate(report.value.period_to)}`, col1, y)

      // Generated date right
      pdf.text(`Generated: ${formatDateTime(report.value.generated_at)}`, col2, y, { align: 'right' })
      if (filterCurrency.value)
        pdf.text(`Currency: ${filterCurrency.value}`, col2, y + 4, { align: 'right' })

      y += 8
      pdf.setDrawColor(200).setLineWidth(0.3).line(col1, y, col2, y)
      y += 6
    }

    function drawTableHeader(cols) {
      pdf.setFillColor(27, 79, 138).setDrawColor(27, 79, 138)
      pdf.rect(col1, y, col2 - col1, 6, 'F')
      pdf.setFontSize(7).setFont('helvetica', 'bold').setTextColor(255)
      let x = col1 + 2
      const colW = (col2 - col1) / cols.length
      cols.forEach((c, i) => {
        const align = i === cols.length - 1 ? 'right' : 'left'
        const xPos  = align === 'right' ? col1 + colW * (i + 1) - 2 : x + colW * i
        pdf.text(c, xPos, y + 4, { align })
      })
      y += 6
    }

    function drawRow(vals, isAlt, colW) {
      checkPage(6)
      if (isAlt) { pdf.setFillColor(248, 250, 252); pdf.rect(col1, y, col2 - col1, 6, 'F') }
      pdf.setFontSize(7).setFont('helvetica', 'normal').setTextColor(50)
      vals.forEach((v, i) => {
        const align = i === vals.length - 1 ? 'right' : 'left'
        const xPos  = align === 'right' ? col1 + colW * (i + 1) - 2 : col1 + 2 + colW * i
        pdf.text(String(v ?? ''), xPos, y + 4, { align })
      })
      y += 6
    }

    function drawSectionTitle(title, total) {
      checkPage(8)
      pdf.setFontSize(8).setFont('helvetica', 'bold').setTextColor(27, 79, 138)
      pdf.text(title.toUpperCase(), col1, y)
      if (total !== undefined) {
        pdf.setTextColor(22, 101, 52)
        pdf.text(formatMoney(total), col2, y, { align: 'right' })
      }
      y += 5
      pdf.setDrawColor(200).setLineWidth(0.2).line(col1, y, col2, y)
      y += 3
    }

    function drawTotalRow(label, value, color) {
      checkPage(7)
      pdf.setFillColor(241, 245, 249)
      pdf.rect(col1, y, col2 - col1, 6, 'F')
      pdf.setFontSize(7.5).setFont('helvetica', 'bold')
      pdf.setTextColor(...(color || [15, 30, 60]))
      pdf.text(label, col1 + 2, y + 4)
      pdf.text(formatMoney(value), col2 - 2, y + 4, { align: 'right' })
      y += 6
    }

    function drawFooter() {
      const footerY = pH - 12
      pdf.setDrawColor(200).setLineWidth(0.3).line(col1, footerY, col2, footerY)
      pdf.setFontSize(6.5).setFont('helvetica', 'normal').setTextColor(130)
      pdf.text('Ulendo Technologies Limited  ·  P.O. Box 37894, Lilongwe 3, Malawi', col1, footerY + 4)
      pdf.text('This is a system-generated document. UlendoPay will NEVER ask for your PIN or password.', col1, footerY + 7.5)
      const pageCount = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(6.5).setTextColor(130)
        pdf.text(`Page ${i} of ${pageCount}`, col2, footerY + 4, { align: 'right' })
        pdf.text(`© ${new Date().getFullYear()} Ulendo Technologies Limited. Confidential.`, col2, footerY + 7.5, { align: 'right' })
      }
    }

    // ── Draw header ───────────────────────────────────────────────────────
    drawHeader()

    // ── TRIAL BALANCE ─────────────────────────────────────────────────────
    if (activeTab.value === 'trial-balance') {
      const accounts = (report.value.accounts || []).filter(a => parseFloat(a.balance || 0) !== 0)
      const groups = accounts.reduce((g, a) => { const k = a.category||'other'; if(!g[k])g[k]=[]; g[k].push(a); return g }, {})
      const colW = (col2 - col1) / 4

      for (const [cat, accs] of Object.entries(groups)) {
        drawSectionTitle(getCategoryLabel(cat))
        drawTableHeader(['Account Code', 'Type', 'Currency', 'Balance'])
        accs.forEach((acc, i) => drawRow([acc.code, acc.type, acc.currency_code, formatMoney(acc.balance)], i%2===0, colW))
        drawTotalRow(`Total ${getCategoryLabel(cat)}`, accs.reduce((s,a)=>s+parseFloat(a.balance||0),0))
        y += 4
      }

      // Summary
      checkPage(20)
      y += 2
      pdf.setDrawColor(200).line(col1, y, col2, y); y += 4
      pdf.setFontSize(8).setFont('helvetica', 'bold').setTextColor(15,30,60)
      pdf.text('SUMMARY', col1, y); y += 6
      drawTotalRow('Total Debits',  trialTotals.value.debits,  [27,79,138])
      drawTotalRow('Total Credits', trialTotals.value.credits, [27,79,138])
      const balanced = trialTotals.value.balanced
      pdf.setFillColor(balanced ? 240:255, balanced ? 253:241, balanced ? 244:242)
      pdf.rect(col1, y, col2-col1, 7, 'F')
      pdf.setFontSize(8).setFont('helvetica','bold').setTextColor(balanced?22:220, balanced?101:38, balanced?52:38)
      pdf.text(balanced ? '✓  BALANCED' : '✗  UNBALANCED', col1+2, y+4.5)
      y += 7
    }

    // ── BALANCE SHEET ─────────────────────────────────────────────────────
    else if (activeTab.value === 'balance-sheet') {
      const blocks = activeCurrencyBlocks.value
      const colW = (col2 - col1) / 3

      for (const block of blocks) {
        checkPage(12)
        // Currency header
        pdf.setFillColor(27,79,138); pdf.rect(col1, y, col2-col1, 7, 'F')
        pdf.setFontSize(9).setFont('helvetica','bold').setTextColor(255)
        pdf.text(block.currency, col1+3, y+4.5)
        const eq = block.totals.equation_balanced
        pdf.setFontSize(7).setTextColor(eq?144:255, eq?238:100, eq?144:100)
        pdf.text(eq ? '✓ Balanced' : '✗ Unbalanced', col2-3, y+4.5, { align: 'right' })
        y += 9

        for (const [section, data] of Object.entries(block.sections)) {
          const nonZero = data.accounts.filter(a => parseFloat(a.balance||0) !== 0)
          if (!nonZero.length) continue
          drawSectionTitle({ asset:'Assets', liability:'Liabilities', equity:'Equity (incl. retained earnings)' }[section] || section)
          drawTableHeader(['Account', 'Type', 'Balance'])
          nonZero.forEach((acc, i) => {
            const tag = acc.type === 'fee' ? `${acc.code} [retained earnings]` : acc.code
            drawRow([tag, acc.type, formatMoney(acc.balance)], i%2===0, colW)
          })
          drawTotalRow(`Total ${section.charAt(0).toUpperCase()+section.slice(1)}`, parseFloat(data.total||0))
          y += 3
        }

        // Equation
        checkPage(8)
        pdf.setFillColor(eq ? 240:255, eq ? 253:241, eq ? 244:242)
        pdf.rect(col1, y, col2-col1, 6, 'F')
        pdf.setFontSize(7).setFont('helvetica','bold').setTextColor(eq?22:220, eq?101:38, eq?52:38)
        pdf.text(`Assets = Liabilities + Equity: ${formatMoney(block.totals.total_assets)} = ${formatMoney(block.totals.total_liabilities_equity)}`, col1+3, y+4)
        y += 8
      }

      // Ledger integrity
      checkPage(8)
      pdf.setFillColor(report.value.ledger_balanced?240:255, report.value.ledger_balanced?253:241, report.value.ledger_balanced?244:242)
      pdf.rect(col1, y, col2-col1, 7, 'F')
      pdf.setFontSize(7.5).setFont('helvetica','bold').setTextColor(report.value.ledger_balanced?22:220, report.value.ledger_balanced?101:38, report.value.ledger_balanced?52:38)
      pdf.text(`Ledger Integrity: ${report.value.ledger_balanced ? 'BALANCED' : 'UNBALANCED'}  |  Raw sum: ${report.value.ledger_sum}`, col1+3, y+4.5)
      y += 7
    }

    // ── PROFIT AND LOSS ───────────────────────────────────────────────────
    else if (activeTab.value === 'profit-loss') {
      const colW = (col2 - col1) / 5

      // Summary box
      checkPage(16)
      pdf.setFillColor(248,250,252); pdf.rect(col1, y, col2-col1, 14, 'F')
      const sumItems = [
        ['TOTAL REVENUE', formatMoney(report.value.totals?.total_revenue), [22,101,52]],
        ['TOTAL EXPENSES', formatMoney(report.value.totals?.total_expenses), [220,38,38]],
        ['NET ' + (report.value.totals?.is_profitable ? 'PROFIT' : 'LOSS'), formatMoney(report.value.totals?.net_profit), [27,79,138]],
      ]
      const boxW = (col2-col1) / 3
      sumItems.forEach(([label, val, color], i) => {
        const bx = col1 + boxW * i
        pdf.setFontSize(6.5).setFont('helvetica','bold').setTextColor(150).text(label, bx+4, y+5)
        pdf.setFontSize(11).setFont('helvetica','bold').setTextColor(...color).text(val, bx+4, y+11)
        if (i < 2) { pdf.setDrawColor(220).setLineWidth(0.2).line(bx+boxW, y+2, bx+boxW, y+12) }
      })
      y += 16

      for (const [section, data] of Object.entries(report.value.sections || {})) {
        const accs = data.accounts || []
        if (!accs.length) continue
        drawSectionTitle(section === 'income' ? 'Revenue' : 'Expenses', data.total)
        drawTableHeader(['Account', 'Currency', 'Credits', 'Debits', 'Net'])
        accs.forEach((acc, i) => drawRow([acc.code, acc.currency_code, formatMoney(acc.credit_total), formatMoney(acc.debit_total), formatMoney(acc.net_movement)], i%2===0, colW))
        drawTotalRow(`Total ${section === 'income' ? 'Revenue' : 'Expenses'}`, parseFloat(data.total||0))
        y += 4
      }
    }

    // ── CASH FLOW ─────────────────────────────────────────────────────────
    else if (activeTab.value === 'cash-flow') {
      const colW = (col2 - col1) / 6

      // Net summary
      checkPage(12)
      pdf.setFillColor(248,250,252); pdf.rect(col1, y, col2-col1, 10, 'F')
      const activities = Object.values(report.value.activities || {})
      const actW = (col2-col1) / Math.max(activities.length + 1, 2)
      activities.forEach((act, i) => {
        const bx = col1 + actW * i
        pdf.setFontSize(6).setFont('helvetica','bold').setTextColor(150).text(act.label.toUpperCase(), bx+3, y+4)
        const pos = parseFloat(act.net_flow||0) >= 0
        pdf.setFontSize(9).setFont('helvetica','bold').setTextColor(pos?22:220, pos?101:38, pos?52:38)
        pdf.text(formatMoney(act.net_flow), bx+3, y+8.5)
      })
      const netPos = parseFloat(report.value.net_cash_flow||0) >= 0
      const lastX = col1 + actW * activities.length
      pdf.setFontSize(6).setFont('helvetica','bold').setTextColor(150).text('NET MOVEMENT', lastX+3, y+4)
      pdf.setFontSize(9).setFont('helvetica','bold').setTextColor(netPos?22:220, netPos?101:38, netPos?52:38)
      pdf.text(formatMoney(report.value.net_cash_flow), lastX+3, y+8.5)
      y += 12

      for (const [key, activity] of Object.entries(report.value.activities || {})) {
        const items = activity.items || []
        if (!items.length) continue
        drawSectionTitle(activity.label, activity.net_flow)
        drawTableHeader(['Activity', 'Currency', 'Transactions', 'Inflows', 'Outflows', 'Net'])
        items.forEach((item, i) => drawRow([
          formatGroupType(item.group_type), item.currency_code,
          item.transaction_count, formatMoney(item.total_credits),
          formatMoney(item.total_debits), formatMoney(item.net_flow)
        ], i%2===0, colW))
        drawTotalRow(`Net ${activity.label}`, parseFloat(activity.net_flow||0))
        y += 4
      }
    }

    drawFooter()
    pdf.save(`UlendoPay-${activeTab.value}-${toDate.value}.pdf`)
    ui.success('PDF exported')
  } catch (e) {
    console.error(e)
    ui.error('PDF export failed: ' + e.message)
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
      const rows = [['Currency', 'Section', 'Account Code', 'Type', 'Balance']]
      for (const block of report.value.by_currency || []) {
        for (const [section, data] of Object.entries(block.sections || {})) {
          for (const acc of data.accounts || []) {
            rows.push([block.currency, section, acc.code, acc.type, acc.balance])
          }
          rows.push([block.currency, `Total ${section}`, '', '', data.total])
        }
        rows.push([block.currency, 'Equation Balanced', '', '', block.totals.equation_balanced ? 'YES' : 'NO'])
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
.finance { padding: 12px; max-width: 1200px; }
@media (min-width: 1024px) { .finance { padding: 32px; } }

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
.currency-select {
  padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 13px; color: #1e293b; background: var(--bg-card); outline: none; min-width: 90px;
}
.currency-select:focus { border-color: #2563eb; }

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
@media (max-width: 1024px) {
  .report-content { border-radius: 10px; }
  .bs-section { padding: 14px 16px; }
  .account-group { padding: 14px 16px; }
  .summary-card { padding: 14px 16px; }
  .summary-card__value { font-size: 16px; }
  .ledger-check { flex-wrap: wrap; padding: 10px 16px; }
  .ledger-check__sum { margin-left: 0; width: 100%; margin-top: 4px; }
  .currency-block__header { padding: 12px 16px 0; }
  .report-print-header { padding: 14px 16px; }
  .rph__title { font-size: 15px; }
  .report-bar { padding: 12px 14px; }
  .report-bar__meta { gap: 8px; }
  .pnl-card { padding: 14px 16px; gap: 12px; }
  .pnl-card__value { font-size: 15px; }
  .cf-summary-card { padding: 14px 16px; }
  .cf-summary-card__value { font-size: 15px; }
  .equation-check { flex-wrap: wrap; }
  .equation-check__values { margin-left: 0; width: 100%; margin-top: 4px; }
  .finance__header h1 { font-size: 18px; }
  .report-tabs { gap: 2px; padding: 3px; }
  .report-tab { min-width: 80px; padding: 8px 10px; font-size: 12px; gap: 5px; }
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
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px; background: #f1f5f9; border-bottom: 1px solid #f1f5f9;
}
.summary-card { padding: 20px 24px; background: var(--bg-card); }
.summary-card__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.summary-card__value { font-size: 20px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.summary-card--balanced .summary-card__value { color: #16a34a; }
.summary-card--unbalanced .summary-card__value { color: #dc2626; }

/* Ledger integrity check */
.ledger-check {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 24px; font-size: 13px; font-weight: 600;
  border-bottom: 1px solid #f1f5f9;
}
.ledger-check--ok   { background: #f0fdf4; color: #166534; }
.ledger-check--fail { background: #fff1f2; color: #dc2626; }
.ledger-check__sum  { margin-left: auto; font-family: monospace; font-size: 12px; font-weight: 400; color: #64748b; }

/* Currency block */
.currency-block { border-bottom: 2px solid #f1f5f9; }
.currency-block:last-child { border-bottom: none; }
.currency-block__header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px 0;
}
.currency-badge {
  background: #1B4F8A; color: #fff; font-size: 13px; font-weight: 800;
  padding: 4px 14px; border-radius: 99px; letter-spacing: 0.05em;
}
.currency-block__eq {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px;
}
.eq--ok   { background: #f0fdf4; color: #16a34a; }
.eq--fail { background: #fff1f2; color: #dc2626; }

/* Account groups */
.account-group { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.account-group:last-child { border-bottom: none; }
.account-group__header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
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
.total-row--asset td     { color: #166534; }
.total-row--liability td { color: #9a3412; }
.total-row--equity td    { color: #1d4ed8; }

.text-right { text-align: right; }
.mono { font-family: 'Courier New', monospace; font-size: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }

/* Retained earnings tag */
.retained-tag {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; margin-left: 6px;
}

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
@media (max-width: 1024px) {
  .bs-grid { grid-template-columns: 1fr; }
  .bs-right { border-left: none; border-top: 2px solid #f1f5f9; }
}
.bs-section { padding: 20px 24px; }
.bs-right { border-left: 1px solid #f1f5f9; }
.bs-section__header {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; margin-bottom: 12px; padding: 10px 14px; border-radius: 8px;
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
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
}
.state-error { color: #dc2626; }
.table-empty { padding: 20px; text-align: center; color: #94a3b8; font-style: italic; }

/* Table horizontal scroll — only the table scrolls, not the card */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-scroll .report-table {
  min-width: 480px;
}
</style>
