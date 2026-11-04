# App Store's required iPhone slot is now the 6.1"/6.3" display (1206x2622).
# capture.mjs renders 6.9" (1320x2868); scale those down rather than re-capturing.
# Usage: powershell -File scripts/app-store-screenshots/resize-6.3.ps1
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot '..\..\store\app-store\screenshots'
$W = 1206; $H = 2622
foreach ($loc in 'en-US', 'tr') {
  $out = Join-Path $root "iphone-6.3\$loc"
  New-Item -ItemType Directory -Force $out | Out-Null
  Get-ChildItem (Join-Path $root $loc) -Filter *.png | ForEach-Object {
    $src = [System.Drawing.Image]::FromFile($_.FullName)
    $scale = [Math]::Max($W / $src.Width, $H / $src.Height)
    $sw = $src.Width * $scale; $sh = $src.Height * $scale
    # 24bpp: App Store rejects screenshots with an alpha channel ("couldn't be saved").
    $bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, [float](($W - $sw) / 2), [float](($H - $sh) / 2), [float]$sw, [float]$sh)
    $bmp.Save((Join-Path $out $_.Name), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $src.Dispose()
  }
}
