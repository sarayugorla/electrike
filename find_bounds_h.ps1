Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\hemab\OneDrive\Desktop\Electrike\electrike\find_bounds.ps1" # just edit find_bounds
$src = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)

for ($x = 0; $x -lt 200; $x += 10) {
    $pixel = $bmp.GetPixel($x, 550)
    Write-Host "X: $x Color: R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
}

for ($x = 850; $x -lt 1024; $x += 10) {
    $pixel = $bmp.GetPixel($x, 550)
    Write-Host "X: $x Color: R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
}
$bmp.Dispose()
