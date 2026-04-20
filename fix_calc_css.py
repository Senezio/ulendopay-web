from pathlib import Path
import re

file_path = Path("src/views/LandingView.vue")
content = file_path.read_text()

# Remove any stray global overrides (safety)
content = re.sub(r'\n\s*\.calc-row\s*\{\s*grid-template-columns:\s*1fr;\s*\}\s*', '\n', content)
content = re.sub(r'\n\s*\.calc-arrow\s*\{\s*display:\s*none;\s*\}\s*', '\n', content)

# Inject rules into existing @media (max-width: 540px)
content = re.sub(
    r'@media\s*\(max-width:\s*540px\)\s*\{\s*\}',
    '''@media (max-width: 540px) {
  .calc-row { grid-template-columns: 1fr; }
  .calc-arrow { display: none; }
}''',
    content
)

file_path.write_text(content)
print("CSS fixed and mobile rules restored")
