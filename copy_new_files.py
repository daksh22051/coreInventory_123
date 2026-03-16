import shutil
import os

src_dir = r'c:\CODING\CoreInventory\frontend\app'
dst_dir = r'c:\CODING\CoreInventory\app'

files = [
    'BulkLabelPrinter.tsx',
    'CSVImportExport.tsx',
    'AdvancedAlertsPage.tsx',
    'CustomDashboardPage.tsx',
    'APIIntegrationsPage.tsx',
]

results = []
for f in files:
    src = os.path.join(src_dir, f)
    dst = os.path.join(dst_dir, f)
    try:
        if not os.path.exists(src):
            results.append(f'{f}: ERROR - source file not found')
            continue
        shutil.copy2(src, dst)
        # Verify
        with open(src, 'rb') as a, open(dst, 'rb') as b:
            match = a.read() == b.read()
        results.append(f'{f}: SUCCESS (verified={match})')
    except Exception as e:
        results.append(f'{f}: ERROR - {e}')

for r in results:
    print(r)
