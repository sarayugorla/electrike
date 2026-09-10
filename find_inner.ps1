Add-Type -AssemblyName System.Drawing
$src = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)

# Let's inspect x=100 and x=500 vertically
Write-Host "Vertical check at X=150:"
for ($y = 350; $y -lt 850; $y += 25) {
    $pixel = $bmp.GetPixel(150, $y)
    Write-Host "Y: $y Color: R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
}
$bmp.Dispose()
