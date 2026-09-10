Add-Type -AssemblyName System.Drawing
$src = "C:\Users\hemab\.gemini\antigravity-ide\brain\cb49c34c-763f-4138-9233-e15f53320ff0\.user_uploaded\media_1789036469966.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)
$destDir = "C:\Users\hemab\OneDrive\Desktop\Electrike\electrike\assets\images"

# If we crop from Y=395 to Y=725:
# Height = 330. Width = 834 (from X=95 to X=929)
$rectClean = New-Object System.Drawing.Rectangle(95, 395, 834, 330)
$cropClean = $bmp.Clone($rectClean, $bmp.PixelFormat)
$cropClean.Save("$destDir\sustainability_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropClean.Dispose()

$bmp.Dispose()
Write-Host "Clean crop saved."
