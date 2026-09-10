Add-Type -AssemblyName System.Drawing
$src = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)
$destDir = "C:\Users\hemab\OneDrive\Desktop\Electrike\electrike\assets\images"

# If we crop from Y=392 to Y=715 (height 323), let's inspect the bottom right 50x50 pixels of that crop
$rect = New-Object System.Drawing.Rectangle(95, 392, 834, 320)
$crop = $bmp.Clone($rect, $bmp.PixelFormat)

# If any corner has gray gear artifact (near x=830, y=310), we can fill/brush with the green bush color
# Bush color around (780, 290) in crop is green: R=40..70, G=120..150, B=60..90
$brushColor = $crop.GetPixel(750, 300)
Write-Host "Bush color at (750, 300): R=$($brushColor.R), G=$($brushColor.G), B=$($brushColor.B)"

# Check pixels at bottom right: x from 780 to 833, y from 280 to 319
$g = [System.Drawing.Graphics]::FromImage($crop)
$solidBrush = New-Object System.Drawing.SolidBrush($brushColor)

# If the corner has gear artifact (brightness difference), paint over with the bush color or texture
for ($x = 790; $x -lt 834; $x++) {
    for ($y = 290; $y -lt 320; $y++) {
        $p = $crop.GetPixel($x, $y)
        # Gear is greyish: R, G, B are close together and R > 100
        if ([Math]::Abs($p.R - $p.G) -lt 25 -and [Math]::Abs($p.G - $p.B) -lt 25 -and $p.R -gt 90) {
            $crop.SetPixel($x, $y, $brushColor)
        }
    }
}
$g.Dispose()

$crop.Save("$destDir\sustainability_final.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$bmp.Dispose()
Write-Host "Final crop with gear touchup saved."
