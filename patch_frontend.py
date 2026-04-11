import re

# ── Router ────────────────────────────────────────────────────────────────────
router_path = '/data/data/com.termux/files/home/ulendopay-web/src/router/index.js'
with open(router_path) as f:
    router = f.read()

withdraw_route = """    {
      path: '/withdraw',
      name: 'withdraw',
      component: () => import('@/views/dashboard/WithdrawView.vue'),
      meta: { requiresAuth: true },
    },"""

# Insert after the topup route block
router = router.replace(
    "      component: () => import('@/views/dashboard/TopUpView.vue'),\n      meta: { requiresAuth: true },\n    },",
    "      component: () => import('@/views/dashboard/TopUpView.vue'),\n      meta: { requiresAuth: true },\n    },\n" + withdraw_route
)

with open(router_path, 'w') as f:
    f.write(router)
print('Router patched')

# ── AppLayout nav ─────────────────────────────────────────────────────────────
layout_path = '/data/data/com.termux/files/home/ulendopay-web/src/components/AppLayout.vue'
with open(layout_path) as f:
    layout = f.read()

layout = layout.replace(
    "{ to: '/topup',    icon: 'fa-solid fa-wallet',           label: 'Top Up' },",
    "{ to: '/topup',    icon: 'fa-solid fa-wallet',           label: 'Top Up' },\n  { to: '/withdraw', icon: 'fa-solid fa-money-bill-transfer', label: 'Withdraw' },"
)

with open(layout_path, 'w') as f:
    f.write(layout)
print('AppLayout patched')
