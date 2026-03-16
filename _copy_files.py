import shutil, os

src = r'c:\CODING\CoreInventory\frontend\app'
dst = r'c:\CODING\CoreInventory\app'

files = [
    'BarcodeGenerator.tsx',
    'BarcodeScanner.tsx',
    'ProductsPage.tsx',
    'ReceiptsPage.tsx',
    'AnalyticsPage.tsx',
]

for f in files:
    s = os.path.join(src, f)
    d = os.path.join(dst, f)
    try:
        shutil.copy2(s, d)
        print(f'OK: {f}')
    except Exception as e:
        print(f'ERROR: {f} -> {e}')
