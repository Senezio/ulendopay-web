from pathlib import Path
import re

file_path = Path("src/views/LandingView.vue")
content = file_path.read_text()

# 1. Update the Template: Change the arrow icon and ensure the receive amount container is robust
content = content.replace(
    '<div class="calc-arrow"><i class="fa-solid fa-arrow-right"></i></div>',
    '<div class="calc-arrow"><i class="fa-solid fa-chevron-right"></i></div>'
)

# 2. Complete CSS Overhaul for the Calculator Section
# This replaces the entire Fee Calculator style block with a responsive, modern version
new_calc_styles = """
/* ── Fee Calculator (Responsive Fix) ─────────────────────────────────────── */
.calculator-section {
  background: #f8f9fa;
  padding: 48px 0;
  border-bottom: 1px solid #efefef;
}
.calc-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
  max-width: 680px;
  margin: 0 auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.calc-card__header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.calc-card__title { font-size: 17px; font-weight: 700; color: #111; }
.calc-card__sub   { font-size: 13px; color: #888; margin-top: 3px; }

.calc-card__body { padding: 24px; }

.calc-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}
.calc-field {
  flex: 1;
  min-width: 0; /* Prevents flex items from overflowing parent */
}
.calc-arrow {
  font-size: 16px; 
  color: #e85d04;
  padding-bottom: 12px; 
  text-align: center;
  transition: transform 0.3s ease;
}
.calc-field label {
  display: block; font-size: 12px; font-weight: 600;
  color: #666; margin-bottom: 6px;
}
.calc-input-wrap {
  display: flex; 
  border: 1px solid #ddd;
  border-radius: 10px; 
  overflow: hidden;
  background: #fff; 
  transition: border-color 0.15s;
}
.calc-input-wrap:focus-within { border-color: #e85d04; }
.calc-input-wrap input {
  flex: 1; padding: 11px 12px; border: none; outline: none;
  font-size: 16px; font-weight: 600; color: #111;
  background: transparent; width: 100%;
}
.calc-input-wrap select {
  padding: 0 8px; border: none; border-left: 1px solid #eee;
  background: #f8f8f8; font-size: 13px; font-weight: 600;
  color: #333; outline: none; cursor: pointer;
}
.calc-input-wrap--receive { background: #fafafa; border-color: #eee; }
.calc-receive-amount {
  flex: 1; padding: 11px 12px;
  font-size: 16px; font-weight: 700; color: #e85d04;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calc-placeholder { color: #ccc; font-weight: 400; }

.calc-breakdown {
  background: #fafafa; border-radius: 10px;
  padding: 14px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.calc-breakdown__row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #555;
  gap: 8px;
}
.calc-breakdown__row span:last-child { text-align: right; font-weight: 600; }

.calc-breakdown__row--total {
  padding-top: 8px; border-top: 1px solid #eee;
  font-weight: 700; color: #111; font-size: 14px;
}
.calc-breakdown__row--total .accent { color: #e85d04; }
.calc-breakdown__source {
  font-size: 11px; color: #aaa; text-align: right; margin-top: 2px;
}
.calc-error {
  font-size: 13px; color: #dc2626; margin-bottom: 12px;
  background: #fef2f2; padding: 10px 12px; border-radius: 8px;
}
.calc-cta { margin-top: 4px; display: block; text-align: center; }

@media (max-width: 600px) {
  .calc-row {
    flex-direction: column;
    align-items: stretch;
  }
  .calc-arrow {
    padding: 0;
    margin: -8px 0;
    transform: rotate(90deg);
  }
}
"""

# Replace the old Fee Calculator section in CSS
content = re.sub(
    r'/\* ── Fee Calculator ──.*?</style>',
    new_calc_styles + "\n</style>",
    content,
    flags=re.DOTALL
)

file_path.write_text(content)
print("Calculator UI fixed: Dynamic layout, no hidden elements, and mobile-responsive.")
