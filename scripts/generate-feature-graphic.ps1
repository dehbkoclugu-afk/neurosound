# Play feature graphic (1024x500) from the app's own night art and display font.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-feature-graphic.ps1
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$W = 1024; $H = 500
$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Art fills the canvas, cropped around its moonlit right side.
$art = [System.Drawing.Image]::FromFile((Join-Path $root 'assets\images\art\intents\sleep.jpg'))
$scale = [Math]::Max($W / $art.Width, $H / $art.Height)
$sh = [int]($H / $scale)
$from = New-Object System.Drawing.Rectangle 0, ([int](($art.Height - $sh) * 0.45)), ([int]($W / $scale)), $sh
$g.DrawImage($art, (New-Object System.Drawing.Rectangle 0, 0, $W, $H), $from, [System.Drawing.GraphicsUnit]::Pixel)
$art.Dispose()

# Darkens the left only, so the name is legible and the picture stays clear.
$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$fade = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(235, 10, 9, 13)), ([System.Drawing.Color]::FromArgb(0, 10, 9, 13)), 0.0
$blend = New-Object System.Drawing.Drawing2D.Blend
$blend.Factors = [single[]]@(0, 0.15, 1)
$blend.Positions = [single[]]@(0, 0.4, 1)
$fade.Blend = $blend
$g.FillRectangle($fade, $rect)

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Join-Path $root 'node_modules\@expo-google-fonts\young-serif\400Regular\YoungSerif_400Regular.ttf'))
$fonts.AddFontFile((Join-Path $root 'node_modules\@expo-google-fonts\schibsted-grotesk\400Regular\SchibstedGrotesk_400Regular.ttf'))
$serif = $fonts.Families | Where-Object { $_.Name -like 'Young*' }
$sans = $fonts.Families | Where-Object { $_.Name -like 'Schibsted*' }
$ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246, 242, 234))
$soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(205, 246, 242, 234))
$px = [System.Drawing.GraphicsUnit]::Pixel
$g.DrawString('852Hz', (New-Object System.Drawing.Font $serif, 112, ([System.Drawing.FontStyle]::Regular), $px), $ink, 64, 140)
$dot = [char]0x00B7 # by code: PowerShell 5 reads this file as ANSI
$g.DrawString("Sleep  $dot  Focus  $dot  Binaural", (New-Object System.Drawing.Font $sans, 32, ([System.Drawing.FontStyle]::Regular), $px), $soft, 72, 284)

$bmp.Save((Join-Path $root 'store\google-play\assets\feature-graphic.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
