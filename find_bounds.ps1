Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($imgPath)

# Sample rows to find where the card starts and ends
# Let's inspect vertical slice at x = 512
for ($y = 200; $y -lt 850; $y += 20) {
    $pixel = $bmp.GetPixel(512, $y)
    Write-Host "Y: $y Color: R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
}
$bmp.Dispose()
