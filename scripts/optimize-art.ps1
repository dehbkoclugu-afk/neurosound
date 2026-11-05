# Shrinks bundled artwork and cuts list thumbnails, because decode cost is what
# janked Explore and flashed dark on Mixer: a 52pt row thumbnail was decoding a
# 1774px JPEG, and the dark set was progressive, which decodes several times
# slower on Android.
#
# - Art wider than 1080px is re-encoded as baseline JPEG at 1080px (a full-bleed
#   phone hero never needs more).
# - Every preset gets a 156px square thumbnail (52pt @3x) in art/thumbs/<scheme>/.
#
# Re-run after adding art; files already at or under 1080px are left alone, so
# running twice does not re-compress anything.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/optimize-art.ps1
Add-Type -AssemblyName System.Drawing
$art = (Resolve-Path (Join-Path $PSScriptRoot '..\assets\images\art')).Path
$MaxWidth = 1080
$ThumbSize = 156
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg($bitmap, $path, [long]$quality) {
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $quality
  $bitmap.Save($path, $jpeg, $params)
  $params.Dispose()
}

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bmp, $g)
}

# Thumbnails first, from the largest source available.
foreach ($set in @(@('dark', 'presets'), @('light', 'light\presets'))) {
  $out = Join-Path $art "thumbs\$($set[0])"
  New-Item -ItemType Directory -Force $out | Out-Null
  Get-ChildItem (Join-Path $art $set[1]) -Filter *.jpg | ForEach-Object {
    $src = [System.Drawing.Image]::FromFile($_.FullName)
    # Centre crop, matching what contentFit="cover" draws in a square.
    $side = [Math]::Min($src.Width, $src.Height)
    $from = New-Object System.Drawing.Rectangle ([int](($src.Width - $side) / 2)), ([int](($src.Height - $side) / 2)), $side, $side
    $to = New-Object System.Drawing.Rectangle 0, 0, $ThumbSize, $ThumbSize
    $bmp, $g = New-Canvas $ThumbSize $ThumbSize
    $g.DrawImage($src, $to, $from, [System.Drawing.GraphicsUnit]::Pixel)
    Save-Jpeg $bmp (Join-Path $out $_.Name) 80
    $g.Dispose(); $bmp.Dispose(); $src.Dispose()
  }
}

# Then shrink the full-size art in place.
Get-ChildItem $art -Recurse -Filter *.jpg | Where-Object { $_.FullName -notlike '*\thumbs\*' } | ForEach-Object {
  $src = [System.Drawing.Image]::FromFile($_.FullName)
  if ($src.Width -le $MaxWidth) { $src.Dispose(); return }
  $h = [int][Math]::Round($src.Height * $MaxWidth / $src.Width)
  $bmp, $g = New-Canvas $MaxWidth $h
  $g.DrawImage($src, 0, 0, $MaxWidth, $h)
  $src.Dispose()
  $tmp = "$($_.FullName).tmp"
  Save-Jpeg $bmp $tmp 82
  $g.Dispose(); $bmp.Dispose()
  Move-Item -Force $tmp $_.FullName
}
