# Derives the alternate app icons from the main icon by colour matrix, so they
# stay in step with it instead of being separately drawn files.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-icon-variants.ps1
Add-Type -AssemblyName System.Drawing
$images = (Resolve-Path (Join-Path $PSScriptRoot '..\assets\images')).Path
$out = Join-Path $images 'alt-icons'
New-Item -ItemType Directory -Force $out | Out-Null

function Recolor($source, $target, [float[][]]$rows, $format) {
  $src = [System.Drawing.Image]::FromFile($source)
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, $format
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $attrs = New-Object System.Drawing.Imaging.ImageAttributes
  $attrs.SetColorMatrix((New-Object System.Drawing.Imaging.ColorMatrix (, $rows)))
  $rect = New-Object System.Drawing.Rectangle 0, 0, $src.Width, $src.Height
  $g.DrawImage($src, $rect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
  $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $attrs.Dispose(); $bmp.Dispose(); $src.Dispose()
}

# Red and blue swapped: the blue pointer turns ember, the graphite stays graphite.
[float[][]]$ember = @(
  [float[]]@(0, 0, 1, 0, 0),
  [float[]]@(0, 1, 0, 0, 0),
  [float[]]@(1, 0, 0, 0, 0),
  [float[]]@(0, 0, 0, 1, 0),
  [float[]]@(0, 0, 0, 0, 1)
)
# Negative with red and blue swapped back: a pale dial that keeps the blue.
[float[][]]$paper = @(
  [float[]]@(0, 0, -1, 0, 0),
  [float[]]@(0, -1, 0, 0, 0),
  [float[]]@(-1, 0, 0, 0, 0),
  [float[]]@(0, 0, 0, 1, 0),
  [float[]]@(1, 1, 1, 0, 1)
)

$rgb = [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
$argb = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
foreach ($v in @(@('ember', $ember), @('paper', $paper))) {
  # iOS rejects an icon with an alpha channel, hence 24bpp here.
  Recolor (Join-Path $images 'icon.png') (Join-Path $out "$($v[0]).png") $v[1] $rgb
  Recolor (Join-Path $images 'android-icon-foreground.png') (Join-Path $out "$($v[0])-foreground.png") $v[1] $argb
}
